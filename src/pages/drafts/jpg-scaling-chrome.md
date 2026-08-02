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

My computer: badly scaled down
My colleagues': scaled down fine

Note: this was not the original logo. This happened a while ago, so I made a separate image to reproduce the issue.

Swapping the image for an SVG fixed it. But I was curious: why was it rendering like this in the first place?

I did some digging and found out that Chrome optimizes JPEG rendering at small scales.

## Scaling down images can be wastefull

The intuitive way to render a small image from a JPEG is to fully decompress it in memory and then scale it down.

But that is not very efficient.

Imagine a 2000 × 2000 JPEG that needs to be displayed at 20 × 20. Once uncompressed, the image takes far more space in memory than the final result. A bitmap of the full image uses roughly 12 MB, while the final 20 × 20 image only needs about 1.2 KB. Most of the information in the large version is lost when scaling down.

### What information is lost when scaling down?

An interesting insight is that the information lost is not random.

When an image is scaled down heavily, the information that disappears is mostly the high-frequency detail. This is easy to see intuitively. Think of a tree with lots of leaves and rough bark: those fine details change quickly from pixel to pixel, so they count as high-frequency information.

If you scale that tree down to something tiny, like 20 × 10, you might end up with just a green blob at the top for the foliage and a brown stick at the bottom for the trunk. The scaled-down version has thrown away the fine detail, the high-frequency information.

[images example]

Some of that high-frequency information still survives a little, because the details get mixed together, so the edges are not perfectly sharp.

### How JPEG stores image data

I will keep this explanation light on jargon and maths, but I will still mention a few technical terms that can be good starting points if you want to dig deeper. I will also skip a fair chunk of the full JPEG transformation, because it is not needed here.

During JPEG compression, images are split into 8 × 8 blocks that are converted into the frequency domain. This operation is called a **DCT**.

In an 8 × 8 block, the lowest possible frequency is a flat color. Strictly speaking, it is not really a frequency because nothing changes, it is the **constant component**. On the opposite side, the highest frequency looks like a checkerboard, where the value changes as much as possible. Everything in between represents the rest of the frequency domain. These are called **basis functions**.

\*discrete cosine transform

[image]

The basis functions: you can see the flat color in the top-left, and the checkerboard in the bottom-right.

So converting an 8 × 8 block into the frequency domain is basically asking: how much of each pattern is present in this block? Those amounts are called **coefficients**.

JPEG compression has a few more steps after that to store those coefficients efficiently, and that is where the lossy compression happens. But that part is not important for what we are discussing here.

### Putting it together: rendering a JPEG at 1/8 scale

Now let’s say you want to shrink an image by a factor of 8.

Those 8 × 8 blocks I mentioned earlier can now be represented by a single pixel in the downscaled image. At that size, the image mostly needs low-frequency information, because, as in the tree example, the high-frequency details mostly disappear during scaling.

So instead of decompressing the whole JPEG, we can skip the coefficients for the high-frequency parts and use only the ones needed for the coarse version of the image. That gives a scaled-down result without fully expanding the original image first.

The decoded image takes less space and is faster to uncompress, since we are skipping a good chunk of the coefficients.

This can be extended to other ratios, as long as they are fractions of 8. The technical name for this is **partial IDCT scaling**. See [jpegclub.org](https://jpegclub.org/djpeg/) (if you read a bit on this you will see that this technique can also be used to upscale images!)

\*inverse discrete cosine transform: taking the frequency domain back to the image domain.

## How Chrome fits in

Chrome delegates image decoding and rendering to Skia. For JPEGs, Skia use libjpeg-turbo, which implements partial IDCT scaling. That lets it decode only the lower-frequency data when the target size is small enough.

In other words, Chrome/Skia does not always decompress the full image and scale it afterward. It computes the closest fraction of 8 , decodes at that scale, [source](https://github.com/google/skia/blob/30ad01017a46a31859b580bc907457b0e43907a8/src/codec/SkJpegCodec.cpp#L383). Then scales the image further using a more traditional downsampling algorithm until it reaches the desired size.

That is why the image had rough edges on my machine. Because it was rendered so small, It was decoded at 1/8 using partial IDCT scaling. So the only data from the frequency representation was the constant component, all nice curves/gradient weren't used.

Really, the moral here is that you shouldn't use JPEG for icons and the likes, the optimization are designed for our perceptions of photos. After all, its in the name Join **Photographic** Expert Group.
