---
title: "Weird JPEG artifacts and How chrome optimize JPEG rendering"
intro: ""
layout: ../../layouts/BlogPostLayout.astro
pubDate: 2026-08-01
editDate: 2026-07-26
---

<style>
  .demo-box {
    margin: 1rem 0; 
    padding: 1rem; 
    border: 1px solid #ccc; 
    border-radius: 6px;
    background: rgba(0, 0, 0, 0.02);
  }
</style>

## The problem

Here is what I saw on my machine:

My computer: scaled down badly
My colleagues: scaled down fine

Note: this was not the original logo. This happened a while ago, so I made a separate image to reproduce the issue.

Swapping the image for an SVG fixed it. But I was intrigued: why was it rendering like this in the first place?

I did some digging and found out that Chrome optimizes JPEG rendering at small scales. I will try to keep this explanation light on jargon.

## How Chrome optimizes JPEGs at small scales

The intuitive way to render a small image from jpg is to fully decompress the JPEG in memory and then scale it down.

But that is not very efficient.

Imagine a 2000 × 2000 image that needs to be displayed at 20 × 20. Once uncompressed, the image takes much more space in memory than the final result. A bitmap of the full image use roughly 12 MB, while the final 20 × 20 image only needs about 1.2 KB. Most of the information in the large version is lost when scaling down.

### What information is lost when scaling down?

That information is not lost at random.

When an image is scaled down heavily, the information that disaper is the the high-frequency one. And it's easy to understand this intuitively actually. Think of an image of a tree with lots of leaves and rough bark: those fine details change quickly from pixel to pixel, so they count as high-frequency information.

If you scale that tree down to something tiny 2x1, you would end up with just a green pixel at the top for the foliage and a brown pixel at the bottom for the trunk. the scaled down version got rid of the fine detail.

### How JPEG stores image data

JPEG works by splitting the image into 8 × 8 blocks and converting each block into the frequency domain. Very roughly speaking, each block can be described as a mix of patterns with different levels of detail.

The lowest frequency is basically a flat color with no change. The highest frequency looks like a checkerboard, with the value changing as much as possible. These patterns are called **basis functions**.

[image]

So converting an 8 × 8 block into the frequency domain is basically asking: how much of each pattern is present in this block? Those amounts are called **coefficients**.

JPEG compression has a few more steps after that to store those coefficients efficiently, but that is not important for what we are discussing here.

### Putting it together: rendering a JPEG at 1/8 scale

Now let’s say you want to shrink an image by a factor of 8.

Those 8 × 8 blocks I mentioned earlier can now be represented by a single pixel in the downscaled image. At that size, the image mostly needs low-frequency information, because the high-frequency details disappear during scaling.

So instead of decompressing the whole JPEG, Chrome can skip the coefficients for the high-frequency parts and use only the ones needed for the coarse version of the image. That gives a scaled-down result without fully decoding the original image first.

It is faster, and it uses less memory.

This can be extended to other scaling ratios as long as they line up well with the JPEG block size.

## How Chrome does it

Chrome uses Skia for image decoding and rendering. For JPEGs, Skia can take advantage of libjpeg-turbo’s partial DCT scaling, which lets it decode only the lower-frequency data when the target size is small enough.

In other words, Chrome does not always decode the full image and scale it afterward. When the scale is convenient, it can ask the JPEG decoder for a smaller version directly, which is much more efficient.

That is why the image looked fine on some machines and badly scaled on mine: Chrome was using a low-scale JPEG optimization that exposed a rendering difference I had not expected.
