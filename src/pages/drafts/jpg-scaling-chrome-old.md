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

Here is what I saw on my mahcine

My computer: scaled down badly
My colleagues: scaled down fine
note : Not the orginal logo, This happened a while ago and I made a image to reproduce the issue.

This icon had been like that for a while and I was seeminly the only one affected, also it wasn't widely used in the app. Upon inspection the icon was actually a big jpg that was scalled down to 20\*20, weird, but it was an internal logo, so the svg wasn't easy to get to. Since it wasn't seeing a lot of traffic anyway, it had been logged and forgoten in the backlog.

Still, I kept seeing it every so often. When I Chirstmas was closing in and I had a bit of bandwidth I asked around to get the proper svg and remplaced the jpg. The weird aliasing was gone, great! an easy fix.

However I was intrigued, why was it rendering like this in the first place ? I played with the bug a bit and quickly realised it was tied to Chrome. As it was rendering fine on safari.

## Is it CSS ?

I didn't really know where to start to investigate this problem. Searching for "Chrome image aliasing" didn't give any lead beside a css property, `image-rendering`, Could it be the browser css ? that wouldn't really make sense, and it would afect many more images but half convived I tried a few thing like `image-rendering: crisp-edges;` and `image-rendering: pixelated;` to no avail.

I tried with png, no problem at a lower scale, the edges were nice. then I decided to try scaling down the image myself, and then use in our app. this time the edges where rendering nicely ! Progress, nice ! so now I had narrowed it down someway it was only with jpg and letting chrome do the scaling. The subsequent serach didn't give me a lot, I found a few thing where people were complaining that the scaling down of the images was blurry on chrome, but I had the opposite problem, my image was too crisp ! some poeple were discusiong jpg compression artifacts but that wasn't really my issue.As it's often the case, I felt like I was just missing the proper name for my problem. So I decided to read the learn about how jpeg works started with a few videos, and got to the jpeg wikipedia page to hopefully find technical terms that i could use in my search.

## Well, I guess I'm reading wikipedia page on JPEG

I relazied a barely knew how JPEG worked, which is a bit sad, it's unavoidable as soon you get next to a somewhat modern computer, and for example I didn't even knew jpeg stood for Join photography expert group.

The technical details are quite interesting and, there are a few neat tricks. It's a good read and I frankly go disctracted by being impressed by how clever jpeg was. In my wikipedia deep dive I somehow ended up on the libjpeg page, and their websidte jpegclub.org (great name!). There was quite a few things about scaling on the home page, which got me excited. Eventually I subbled on "Partial IDCT Scaling". AH!

## Partial IDCT Scaling and how jpg works.

Yes obviously partial idct scaling! trivial!

To fully understand the rest of this post, you'll need to have a rought how jpg compression works,I find the wikipedia page is excellent. But if you prefer here is a quick primer, that will oversimplfy and skip a few things to allow you to follow the rest of the post.

DCT, 16, low freq = color doesnt change, basically something mono chromatic

Again this is quite an oversimplicifation, there is a color space change happening, the dct coeficient, the ordeging aren't mentioned.


## The problem

Here is what I saw on my mahcine

My computer: scaled down badly
My colleagues: scaled down fine
note : Not the orginal logo, This happened a while ago and I made a image to reproduce the issue.

Swaping the image for a svg fixed it, However I was intrigued, why was it rendering like this in the first place ? I did some digging and discovered how chrome optimize jpg rendering at low scales. I'll try to keep this explaniation away from maths notations/lingo.

## How chrome optimize jpg at low scales.

The intuitive idea to render a small image is that chrome has to render the full jpg somewhere in memory and then scale it down. But turns out this is quite inneficient, imagine you have a 2000px per 2000px image that you need to render at 20px per 20px. Once un-compressed, menaing each pixel value is stored somewhere in memorey, the jpg takes much more space (TO CHECK), roughtly 12MB (it's basically a bitmap then). For in the end scaling it to only 20px 20px  that would only need 1.2kB as bitmap. with a lot of informatin that is lost. 

### What informatoin is lost when scaling down
But this information is not lost at random ! We know it's gonna be a high-frequency data. Imagine a picture of a tree, with a lot of foillage, and a bark that really coarse, all of those are details, and details are "high frequency" as in to represent them the value has to change a lot, thus if you scale down this tree to 2x1 you would have a green pixel at the top for the foillage, a brown pixel a the bottom.


### How jpg store image date
The way jpg work (oversimplifying a lot here) is that each 8x8 block is converted to the frequency domain. The number of Frequency a 8x8 block can represent is limited, the lowest frequency being monochrome (no change), the highest is a checker partern (maxium change). these are called the basis functions.

[image]

So converting a 8x8 block to the frequency domain is basically answering, how much each of those pattern are in the original 8x8 block, the how much here are called coefficients. There are a few more steps to jpg compression, to optimize how those coefficients are stored. But it not relevelant for what we're disscusing here. 

### Putting it together, Rendering an jpg at 1/8 scale

Now let's say you have a image that you want to reduce the size by 8. those 8x8 block that i mentionend previously will be represented by one pixel in the sacled down version of the image. This pixel will be mostly low frequency data since high freqency information disapear when sacling down. So instaed of decompressing the whole jpg we can skip the coeffients for the high frequency stufff and only use the coefficent for the monochrome part of the block. with this we get a scaled down image without ever decompressing the whole data. It's faster and takes less space in memory. This can be extener for various ration of sacling as long as it's a fraction of 8.


## How chrome does it

Skia
 closest ratio + scale down after, uses libjpegturbo

Link to chrome call to skia https://github.com/google/skia/blob/30ad01017a46a31859b580bc907457b0e43907a8/src/codec/SkJpegCodec.cpp#L383 jpg-turbo, partial DCT, only using lower freq, scaling according to how many dct are used
