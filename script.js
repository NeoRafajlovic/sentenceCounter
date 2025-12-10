// -----------------------------
// TRAILER CURSOR (unchanged)
// -----------------------------
const trailer = document.getElementById("trailer");
const body = document.querySelector("body");
const navbar = document.getElementById("navbar");

body.addEventListener("mouseover", function () {
  trailer.style.opacity = 0.75;
});

body.addEventListener("mouseout", function () {
  trailer.style.opacity = 0;
});

window.onmousemove = (e) => {
  const x = e.clientX - trailer.offsetWidth / 2,
        y = e.clientY - trailer.offsetHeight / 2;
  trailer.style.transform = `translate(${x}px, ${y}px)`;
};

let mouseIsUp = false;
let cursorIsDown = false;

window.addEventListener("mouseup", () => {
  mouseIsUp = true;
  if (cursorIsDown) {
    trailer.style.opacity = 0.75;
    cursorIsDown = false;
  }
});

window.addEventListener("scroll", () => {
  if (window.scrollY >= 50) {
    navbar.style.height = "50px";
    navbar.style.opacity = 0.5;
    navbar.style.backgroundColor = "rgb(50, 50, 50)";
  } else {
    navbar.style.height = "150px";
    navbar.style.opacity = 0.75;
    navbar.style.backgroundColor = "rgb(20, 20, 20)";
  }
});

window.onmousedown = () => {
  mouseIsUp = false;
  trailer.style.opacity = 0.3;
  setTimeout(() => {
    if (mouseIsUp) {
      trailer.style.opacity = 0.75;
      cursorIsDown = false;
    } else {
      cursorIsDown = true;
    }
  }, 200);
};

// -----------------------------
// SENTENCE COUNTER
// -----------------------------
const textBox = document.getElementById("textBox");
const pSpan = document.getElementById("pSpan");

function countSentences(text) {
  const abbrev = [
    "mr.", "mrs.", "ms.", "dr.", "prof.", "sr.", "jr.",
    "e.g.", "i.e.", "etc.", "vs.", "a.m.", "p.m.",
    "u.s.", "u.k.", "u.n.", "c.i.a.", "f.b.i."
  ];

  let sentences = 0;
  let i = 0;

  while (i < text.length) {
    if (text.substring(i, i + 3) === "...") {
      i += 3;
      continue;
    }

    if (text[i] === ".") {
      const before = text.slice(Math.max(0, i - 6), i + 1).toLowerCase();

      if (abbrev.some(a => before.endsWith(a))) {
        i++;
        continue;
      }

      if (/\d\.\d/.test(text.substring(i - 1, i + 2))) {
        i++;
        continue;
      }

      if (/[a-zA-Z0-9]\.[a-zA-Z]/.test(text.substring(i - 1, i + 2))) {
        i++;
        continue;
      }

      sentences++;
    }

    if (text[i] === "?" || text[i] === "!") {
      sentences++;
    }

    i++;
  }

  return sentences;
}

textBox.addEventListener("input", () => {
  pSpan.textContent = countSentences(textBox.value);
});
