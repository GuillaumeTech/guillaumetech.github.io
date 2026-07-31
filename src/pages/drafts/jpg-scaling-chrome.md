---
title: "How chrome optimize jpg rendering"
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

## The issue

I stublbled upon this while debugging a weird rendering artifact, we used a big jpg for a tiny icon (ok sure, this is a bad practive in the first place, in the end the fix is simply using a .svg instead) and only on my machine it was looking like this. I was the only one using chrome so that where i started looking.

example
me
Original -> scaled down bad

everyone elese
Original -> scaled down

## Quick primer on how jpg store images

To fully understand the rest of this post, you'll need to have a rought how jpg compression works,I find the wikipedia page is excellent. But if you prefer here is a quick primer, that will oversimplfy and skip a few things to allow you to follow the rest of the post.

DCT, 16, low freq = color doesnt change, basically something mono chromatic

Again this is quite an oversimplicifation, there is a color space change happening, the dct coeficient, the ordeging aren't mentioned. 

## How chrome optimize jpg at low scales.

The intuitive idea to render a small image is that chrome has to render the full jpg somewhere in memory and then scale it down. But turns out this is quite inneficient, imagine you have a 2000px per 2000px image that you need to render at 20px per 20px. Once decoded the jpg takes much more space (TO CHECK), roughtly 12MB (it's basically a bitmap then). For in the end scaling it to only 20px 20px (1.2kB as bitmap). with a lot of informatin that is lost. But this information is not lost at random ! We know it's gonna be a high-frequency data. Imagine a picture of a tree, with a lot of foillage, and a bark that really coarse, all of those are details, and details are "high frequency", thus if you scale down this tree to 2x1 you would have a green pixel at the top for the foillage, a brown pixel a the bottom. Do you see where this is going ?
the jpg compression order it's data from low to hight freq. and it's abslutely possible to only decode part of it. 

It's called a partial IDCT, where during decoding we only care about the a subset of the coeficient. thus rendering a scaled down image directly. if you decode 1 out of 8 you effectively scale down the image by 8 and



A nice trick from jpg relying on frequency data is that you can  

Link to chrome call to skia  https://github.com/google/skia/blob/30ad01017a46a31859b580bc907457b0e43907a8/src/codec/SkJpegCodec.cpp#L383 jpg-turbo, partial DCT, only using lower freq, scaling according to how many dct are used
