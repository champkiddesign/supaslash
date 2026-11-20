import AppKit
import CoreGraphics
import Foundation

guard CommandLine.arguments.count == 3 else {
  fputs("usage: extract-app-icon.swift <logo.png> <icon-source.png>\n", stderr)
  exit(1)
}

let sourceURL = URL(fileURLWithPath: CommandLine.arguments[1])
let destURL = URL(fileURLWithPath: CommandLine.arguments[2])

guard let image = NSImage(contentsOf: sourceURL) else {
  fputs("Could not read \(sourceURL.path)\n", stderr)
  exit(1)
}

var proposed = NSRect(origin: .zero, size: image.size)
guard let cgImage = image.cgImage(forProposedRect: &proposed, context: nil, hints: nil) else {
  fputs("Could not decode \(sourceURL.path)\n", stderr)
  exit(1)
}

let width = cgImage.width
let height = cgImage.height
let bytesPerPixel = 4
let bytesPerRow = width * bytesPerPixel
var pixels = [UInt8](repeating: 0, count: height * bytesPerRow)

let drawn = pixels.withUnsafeMutableBytes { raw -> Bool in
  guard let ctx = CGContext(
    data: raw.baseAddress,
    width: width,
    height: height,
    bitsPerComponent: 8,
    bytesPerRow: bytesPerRow,
    space: CGColorSpaceCreateDeviceRGB(),
    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
  ) else { return false }
  ctx.draw(cgImage, in: CGRect(x: 0, y: 0, width: width, height: height))
  return true
}
guard drawn else {
  fputs("Could not draw logo pixels\n", stderr)
  exit(1)
}

func brightness(_ x: Int, _ y: Int) -> Int {
  let i = (y * width + x) * 4
  let a = Int(pixels[i + 3])
  if a < 40 { return 0 }
  return (Int(pixels[i]) + Int(pixels[i + 1]) + Int(pixels[i + 2])) / 3
}

func columnHasMark(_ x: Int) -> Bool {
  var hits = 0
  for y in 0..<height where brightness(x, y) > 90 {
    hits += 1
    if hits > 8 { return true }
  }
  return false
}

var markStart = 0
while markStart < width && !columnHasMark(markStart) { markStart += 1 }
var markEnd = markStart
var gap = 0
while markEnd < width {
  if columnHasMark(markEnd) {
    gap = 0
  } else {
    gap += 1
    if gap > 6 { break }
  }
  markEnd += 1
}
markEnd -= gap

func rowHasMark(_ y: Int) -> Bool {
  for x in markStart..<max(markStart + 1, markEnd) where brightness(x, y) > 90 { return true }
  return false
}
var top = 0
var bottom = height - 1
while top < bottom && !rowHasMark(top) { top += 1 }
while bottom > top && !rowHasMark(bottom) { bottom -= 1 }

let markWidth = max(1, markEnd - markStart)
let markHeight = max(1, bottom - top + 1)
let side = max(markWidth, markHeight)
let originX = markStart - (side - markWidth) / 2
let originY = top - (side - markHeight) / 2

var tile = [UInt8](repeating: 0, count: side * side * 4)
var graySamples: [Int] = []
for y in 0..<side {
  for x in 0..<side {
    let srcX = originX + x
    let srcY = originY + y
    let dst = (y * side + x) * 4
    if srcX < 0 || srcY < 0 || srcX >= width || srcY >= height {
      tile[dst + 3] = 0
      continue
    }
    let src = (srcY * width + srcX) * 4
    tile[dst] = pixels[src]
    tile[dst + 1] = pixels[src + 1]
    tile[dst + 2] = pixels[src + 2]
    tile[dst + 3] = pixels[src + 3]
    let bright = brightness(srcX, srcY)
    if pixels[src + 3] > 200 && bright > 110 && bright < 230 {
      graySamples.append(bright)
    }
  }
}
let fill = UInt8(graySamples.sorted().dropFirst(graySamples.count / 2).first ?? 180)

var seen = Array(repeating: false, count: side * side)
var queue = [(0, 0), (side - 1, 0), (0, side - 1), (side - 1, side - 1)]
var head = 0
while head < queue.count {
  let (x, y) = queue[head]
  head += 1
  if x < 0 || y < 0 || x >= side || y >= side { continue }
  let index = y * side + x
  if seen[index] { continue }
  seen[index] = true
  let dst = index * 4
  let bright = (Int(tile[dst]) + Int(tile[dst + 1]) + Int(tile[dst + 2])) / 3
  let empty = tile[dst + 3] < 40 || bright < 50
  if !empty { continue }
  tile[dst] = fill
  tile[dst + 1] = fill
  tile[dst + 2] = fill
  tile[dst + 3] = 255
  queue.append((x + 1, y))
  queue.append((x - 1, y))
  queue.append((x, y + 1))
  queue.append((x, y - 1))
}

let canvas = 1024
var output = [UInt8](repeating: fill, count: canvas * canvas * 4)
let made = output.withUnsafeMutableBytes { raw -> Bool in
  guard let ctx = CGContext(
    data: raw.baseAddress,
    width: canvas,
    height: canvas,
    bitsPerComponent: 8,
    bytesPerRow: canvas * 4,
    space: CGColorSpaceCreateDeviceRGB(),
    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
  ) else { return false }
  ctx.setFillColor(CGColor(red: CGFloat(fill) / 255, green: CGFloat(fill) / 255, blue: CGFloat(fill) / 255, alpha: 1))
  ctx.fill(CGRect(x: 0, y: 0, width: canvas, height: canvas))
  ctx.interpolationQuality = .high
  guard let tileImage = tile.withUnsafeMutableBytes({ tileRaw -> CGImage? in
    guard let tileCtx = CGContext(
      data: tileRaw.baseAddress,
      width: side,
      height: side,
      bitsPerComponent: 8,
      bytesPerRow: side * 4,
      space: CGColorSpaceCreateDeviceRGB(),
      bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
    ) else { return nil }
    return tileCtx.makeImage()
  }) else { return false }
  ctx.draw(tileImage, in: CGRect(x: 0, y: 0, width: canvas, height: canvas))
  return true
}
guard made else {
  fputs("Could not scale icon\n", stderr)
  exit(1)
}

guard let outCtx = output.withUnsafeMutableBytes({ raw in
  CGContext(
    data: raw.baseAddress,
    width: canvas,
    height: canvas,
    bitsPerComponent: 8,
    bytesPerRow: canvas * 4,
    space: CGColorSpaceCreateDeviceRGB(),
    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
  )
}), let outImage = outCtx.makeImage() else {
  fputs("Could not encode icon\n", stderr)
  exit(1)
}

let rep = NSBitmapImageRep(cgImage: outImage)
guard let png = rep.representation(using: .png, properties: [:]) else {
  fputs("Could not encode PNG\n", stderr)
  exit(1)
}
do {
  try png.write(to: destURL)
} catch {
  fputs("Could not write \(destURL.path): \(error)\n", stderr)
  exit(1)
}
fputs("Wrote \(destURL.path) from mark \(markWidth)x\(markHeight)\n", stderr)
