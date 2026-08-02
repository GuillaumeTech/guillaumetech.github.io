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

I did some digging and found out that Chrome optimizes JPEG rendering at small scales.

## How Chrome optimizes JPEGs at small scales

The intuitive way to render a small image from jpg is to fully decompress the JPEG in memory and then scale it down.

But that is not very efficient.

Imagine a 2000 × 2000 image that needs to be displayed at 20 × 20. Once uncompressed, the image takes much more space in memory than the final result. A bitmap of the full image use roughly 12 MB, while the final 20 × 20 image only needs about 1.2 KB. Most of the information in the large version is lost when scaling down.

### What information is lost when scaling down?

That information is not lost at random.

When an image is scaled down heavily, the information that disaper is the the high-frequency one. And it's easy to understand this intuitively actually. Think of an image of a tree with lots of leaves and rough bark: those fine details change quickly from pixel to pixel, so they count as high-frequency information.

If you scale that tree down to something tiny like, 2x1, you would end up with just a green pixel at the top for the foliage and a brown pixel at the bottom for the trunk. the scaled down version got rid of the fine detail, the high frequency information.

images example

This high frequency information. stil somewhat survied as they are "mixed" together the the edges aren't so sharp.

### How JPEG stores image data

I will keep this explanation light on jargon/maths, but still provide a few technical term that can be a good starting ponint if you want to dig deeper. Still, I'll simplify a lot and will skip a good chunck of the whole jpeg transformation.

During the compression for JPEG the images are splited into 8 × 8 blocks that are converted to the frequency domain, this operation is called a **DCT**.

In this 8x8 block, the lowest frequency possible is a flat color (well, it's not really a frequency because it doesn't change). The highest frequency looks like a checkerboard, the value is changing as much as possible. And the whole frequency domain would be all the possible image in between. there are called **basis functions**.

*discret cosinus transfrorm
[image]
The basis functions, you can see the flat color in the top left, and the checker board in the bottom right.

So converting an 8 × 8 block into the frequency domain is basically asking: how much of each pattern is present in this block? Those amounts are called **coefficients**.

JPEG compression has a few more steps after that to store those coefficients efficiently, and it's where the lossy compression happens, but that's not important for what we are discussing here.

### Putting it together: rendering a JPEG at 1/8 scale

Now let’s say you want to shrink an image by a factor of 8.

Those 8 × 8 blocks I mentioned earlier can now be represented by a single pixel in the downscaled image. At that size, the image mostly needs low-frequency information, because, as in the example with the tree, the high-frequency details disappear during scaling.

So instead of decompressing the whole JPEG, we can skip the coefficients for the high-frequency parts and use only the ones needed for the coarse version of the image. That gives a scaled-down result without fully decoding the original image first.

The decoded images takes less spaces and are faster to decode since we're skping a good chunk of the coefficients.

This can be exetended to other ratio, as long as they are fraction of 8. And it's technical name is "partial IDCT* scaling" see [jpegclub.org](https://jpegclub.org/djpeg/) (if you read a bit on this you'll see that this technique can also be used to upscale!)

*Inverse discret cosinus transform, taking the frequency domain to the image domain.

## How Chrome fit in this

Chrome delegate to Skia for image decoding and rendering. For JPEGs, Skia uses libjpeg-turbo’s, which implement partial IDCT scaling, which lets it decode only the lower-frequency data when the target size is small enough.

In other words, Chrome does not always decode the full image and scale it afterward. It compute the closest fraction of 8, decompress at this scale and then scales down the images more (using a more classic, downsampling algorithm) until they reaches the desired ratio.

This why is the image had rought edges on my machine, being rendered so small, all the curves and nice transition werne't event present in the decompressed ouput. it was rendered at 1/8 using partial IDCT scaling, and then furter scaled down.