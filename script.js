const header = document.querySelector(".site-header");
const navToggle = document.querySelector(".nav-toggle");
const navMenu = document.querySelector(".nav-menu");
const backToTop = document.querySelector(".back-to-top");
const navLinks = document.querySelectorAll(".nav-menu a");
const revealElements = document.querySelectorAll(".reveal");

function updateHeaderState() {
  const hasScrolled = window.scrollY > 24;
  header.classList.toggle("scrolled", hasScrolled);
  backToTop.classList.toggle("show", window.scrollY > 420);
}

function closeMobileMenu() {
  navToggle.classList.remove("active");
  navToggle.setAttribute("aria-expanded", "false");
  navMenu.classList.remove("open");
}

navToggle.addEventListener("click", () => {
  const isOpen = navMenu.classList.toggle("open");
  navToggle.classList.toggle("active", isOpen);
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

navLinks.forEach((link) => {
  link.addEventListener("click", closeMobileMenu);
});

backToTop.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.16
  }
);

revealElements.forEach((element) => observer.observe(element));

window.addEventListener("scroll", updateHeaderState);
window.addEventListener("load", updateHeaderState);
