/**
 * 🎣 小猫钓鱼打卡系统（稳定执行版）
 */
document.addEventListener("DOMContentLoaded", () => {
    const btn = document.querySelector(".fish-btn");
    const daysEl = document.querySelector(".fish-days");
    const scene = document.getElementById("fishScene");
    const toast = document.getElementById("toast");

    let days = Number(localStorage.getItem("fishDays") || 0);
    const today = getTodayKey();
    const last = localStorage.getItem("fishLast");


    updateUI();

    btn.onclick = () => {
        if (last === today) {
            showToast("🐟 今天已经钓过鱼啦");
            return;
        }

        scene.className = "fish-scene cast";

        setTimeout(() => {
            scene.className = "fish-scene success";
            days++;
            localStorage.setItem("fishDays", days);
            localStorage.setItem("fishLast", today);
            updateUI();
            showToast("🎉 钓到一条小鱼！");
        }, 500);
    };

    function updateUI() {
        daysEl.textContent = `已钓鱼 ${days} 天`;
        if (localStorage.getItem("fishLast") === today) {
            btn.textContent = "今天已钓";
            btn.disabled = true;
        }
    }

    function showToast(msg) {
        toast.textContent = msg;
        toast.classList.add("show");
        setTimeout(() => toast.classList.remove("show"), 2000);
    }
});
function getTodayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

