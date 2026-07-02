// Site-wide behavior: navbar burger toggle for the mobile menu.
// Extracted from an inline <script> in baseof.html.
document.addEventListener('DOMContentLoaded', () => {

    // Get all "navbar-burger" elements
    const $navbarBurgers = Array.prototype.slice.call(document.querySelectorAll('.navbar-burger'), 0);

    // Check if there are any navbar burgers
    if ($navbarBurgers.length > 0) {

        // Add a click event on each of them
        $navbarBurgers.forEach(el => {
            el.addEventListener('click', () => {

                // Get the target from the "data-target" attribute
                const target = el.dataset.target;
                const $target = document.getElementById(target);

                // Toggle the "is-active" class on both the "navbar-burger" and the "navbar-menu"
                el.classList.toggle('is-active');
                $target.classList.toggle('is-active');
                el.setAttribute('aria-expanded', el.classList.contains('is-active'));

            });
        });

        // Close an open menu on Escape and return focus to its burger
        document.addEventListener('keydown', (event) => {
            if (event.key !== 'Escape') return;
            $navbarBurgers.forEach(el => {
                if (!el.classList.contains('is-active')) return;
                const $target = document.getElementById(el.dataset.target);
                el.classList.remove('is-active');
                $target.classList.remove('is-active');
                el.setAttribute('aria-expanded', 'false');
                el.focus();
            });
        });
    }

});
