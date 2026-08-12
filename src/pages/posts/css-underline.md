---
title: "Sliding color change underline on hover"
intro: "I wanted this effect for the in-text links on my website, but I could not find a ready-made one that did what I wanted, so here is a short tutorial"
layout: ../../layouts/BlogPostLayout.astro
pubDate: 2026-07-25
editDate: 2026-08-11
---

<style>
  .demo-box {
    margin: 1rem 0; 
    padding: 1rem; 
    border: 1px solid #ccc; 
    border-radius: 6px;
    background: rgba(0, 0, 0, 0.02);
  }

  .demo-link {
    display: inline-block;
    position: relative;
    clip-path: inset(-5px 0);
    color: black;
    font-weight: 600;
    text-decoration: none;
    paint-order: stroke fill;
    -webkit-text-stroke: 0.3em var(--background-color);
  }

  .demo-link::after {
    content: "";
    position: absolute;
    bottom: 0px;
    left: 0;
    width: 250%;
    height: 1px;
    background: linear-gradient(to right, limegreen, limegreen 50%, black 50%, black);
    transition: transform 250ms ease-in-out;
    transform: translateX(-50%);
    z-index: -1;
  }

  .demo-link:hover::after {
    transform: translateX(0);
  }

  .demo-link.overflow {
    display: inline;
    clip-path: none;
  }

  .demo-link.bad-align {
    display: inline-block;
    overflow: hidden;
  }

  .demo-link.descender {
     paint-order: none;
    -webkit-text-stroke: unset;
  }
</style>

## Skip the chit-chat, here is the code:

This style transitions from black to green like so: <a href="#" class="demo-link">Example link</a>

```css
a {
  display: inline-block;
  position: relative;
  clip-path: inset(-5px 0);
  paint-order: stroke fill;
  -webkit-text-stroke: 0.3em var(--background-color);
}

a::after {
  content: "";
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 250%;
  height: 1px;
  background: linear-gradient(
    to right,
    limegreen,
    limegreen 50%,
    black 50%,
    black
  );
  transition: transform 250ms ease-in-out;
  transform: translateX(-50%);
  z-index: -1;
}

a:hover::after {
  transform: translateX(0);
}
```

## With the chit-chat

Yes, sure, I could have used an LLM for this, but there is no fun in that. The CSS to make this work is quite simple in the end, but there are a few little tricks. Hopefully this can be of help to somebody, and you learn a thing or two!

## Gradient trick

To have two colors, we use a gradient with overlapping color stops (two colors at the exact same spot in the `linear-gradient` giving us a sharp transition), then we translate this two-colored bar on hover. Another trick is making this bar wider than 200% so we don't get a leftover pixel on the side.

Here is an example of what the animated underline with the gradient looks like:

<div class="demo-box">
  This underline is <a href="#" class="demo-link overflow">nice</a>, but it's leaking!
</div>

## display: inline vs inline-block

Now we need to hide the overflowing gradient outside our link. So `overflow: hidden`, right?

The problem is that we need `display: inline-block` for `overflow: hidden` to actually work! But that combination changes the link's baseline and limits us to where the underline could be positioned, a bit too far from the text and it's not visible anymore.

Edit 2026-08-11: `vertical-align` could fix the alignement of the base line, but we would still have the cropping problem.

<div class="demo-box">
  Lorem ipsum dolor sit <a href="#" class="demo-link bad-align">BADABIM!</a> amet
</div>

## Hiding the overflow with clip-path: inset()

Another way to hide overflow is `clip-path`, which is way more flexible, you can basically write SVG shapes to draw anything you want.

It also provides us with a useful function, `inset()`, which "defines a rectangle at the specified inset distances from each side of the reference box" <sup><a href="https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/basic-shape/inset" target="_blank">MDN</a></sup>.

By using `clip-path: inset(-5px 0);`, we cut off horizontal overflow to the left and right (`0`) while allowing slight vertical room (`-5px`) so the underline thickness doesn't get clipped on top or bottom.

We still keep `display: inline-block`. Safari has trouble clipping regular inline boxes, but an inline block gives it one clean box to clip without the baseline problem caused by `overflow: hidden`.

## Arf! descenders

<div class="demo-box">
  eh <a href="#" class="demo-link descendern">paf!</a> The underline touches the bottom of the p
</div>

There are two way to go about this either you can position the underline lower, but I'm not fond of this option. Or we can try to reproduce `text-decoration-skip-ink`, which I prefer. For this we use `-webkit-text-stroke` which allow-us to draw a outline of our text in the same color as the background, effectively "eating" at the underline. We also use `paint-order: stroke fill;` to have the stroke grow outide the text.


## That's it!

Here is the final result working smoothly:

<div class="demo-box">
  Try hovering over this <a href="#" class="demo-link">smooth sliding underline link</a> in action!
</div>
