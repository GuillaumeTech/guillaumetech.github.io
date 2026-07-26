---
title: "Underline with slide in color change on hover"
intro: "I wanted this effect for the in text links on my website, but I could not find a ready made one that did what I wanted, so here is a short tutorial"
layout: ../../layouts/BlogPostLayout.astro
pubDate: 2026-07-25
editDate: 2026-07-26
---

<style>
.demo-box {
    margin: 1rem 0; 
    padding: 1rem; 
    border: 1px solid #ccc; 
    border-radius: 6px;
     background: rgba(0,0,0,0.02);
}
  .demo-link {
    position: relative;
    clip-path: inset(-5px 0);
    color: black;
    font-weight: 600;
    text-decoration: none;
  }

  .demo-link::after {
    content: "";
    position: absolute;
    bottom: -1px;
    left: 0;
    width: 250%;
    height: 2px;
    background: linear-gradient(to right, lime, lime 50%, black 50%, black);
    transition: transform 250ms ease-in-out;
    transform: translate3d(-50%, 0, 0);
  }

  .demo-link:hover::after {
    transform: translate3d(0, 0, 0);
  }

  .demo-link.overflow {
    display: inline;
    clip-path: none;
  }

  .demo-link.bad-align {
    display: inline-block;
    overflow: hidden;
  }

</style>

## Skip the chit-chat, here is the code:

This style transitions from black to green like so: <a href="#" class="demo-link">Example link</a>

```css
a {
  position: relative;
  clip-path: inset(-5px 0);
}

a::after {
  content: "";
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 250%;
  height: 1px;
  background: linear-gradient(to right, black, black 50%, blue 50%, blue);
  transition: transform 250ms ease-in-out;
  transform: translate3d(-50%, 0, 0);
}

a:hover::after {
  transform: translate3d(0, 0, 0);
}
```

## With the chit-chat

Yes sure I could have used a LLM for this, but there is no fun in that. The CSS to making this work is quite simple in the end, but there are a few little tricks. Hopefully that can be of help to somebody, and you learn a thing or two!

## Gradient trick

To have two colors we use a gradient, with overlapping color stops (with two color at the same spot in the linear-gradient giving us a sharp transition), then we can translate this 2 colored bar on hover. Another this is making this bar a wider than 200% so we don't get a leftover pixel on the side.

Here is an example the animated underline with the gradient looks like:

<div class="demo-box">
  This is underline is <a href="#" class="demo-link overflow">nice</a> but leaking!
</div>

## display: inline vs inline-block

Now we need to hide the overflowing gradient outside our link. So `overflow: hidden`, right?

The problem is that we need `display: inline-block` for `overflow: hidden` to actually work! But with `display: inline-block` it's not aligned properly with text anymore and it's slighly cropped (the line in only 1px while before it was 2px before)

<div class="demo-box">
  Lorem ipsum dolor sit  <a href="#" class="demo-link bad-align">BADABIM</a> ! amet
</div>

## hiding the overflow with clip-path:inset()

Another way to hide overflow is `clip-path`, which is way more flexible, and you can basically write svg to draw any shape you want.
It also provide use with a useful function `inset()` which "defines a rectangle at the specified inset distances from each side of the reference box" <sup><a href='https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/basic-shape/inset'> mdn </a></sup>.

By using `clip-path: inset(-5px 0);`, we cut off horizontal overflow to the left and right (`0`) while allowing slight vertical room (`-5px`) so the underline thickness doesn't get clipped on top or bottom.

## That's it !

Here is the final result working smoothly:

<div class="demo-box">
   Try hovering over this <a href="#" class="demo-link">smooth sliding underline link</a> in action!
</div>
