document.addEventListener("DOMContentLoaded", () => {
    const clickable_btn = document.querySelector(".clickable");

    clickable_btn.addEventListener("click", () => {
        window.location.href = "/terms";
    });
});
