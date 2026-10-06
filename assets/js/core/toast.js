/**
 * TVZINHA ONLINE - Global Toast Notification System
 */

let toastTimer = null;

export function showToast(message, duration = 3200) {
    if (typeof document === 'undefined') return;
    const toast = document.getElementById("app-toast");
    if (!toast) return;

    toast.textContent = message;
    toast.classList.remove("hidden");

    if (toastTimer) {
        clearTimeout(toastTimer);
    }

    toastTimer = setTimeout(() => {
        toast.classList.add("hidden");
        toastTimer = null;
    }, duration);
}
