function showCuteToast(message){
  if(UI_LANG!=="zh")return;
  const box=document.querySelector("#cute-toast");if(!box)return;
  const animals=["🐰","🐼","🐣","🦊"];box.querySelector("b").textContent=animals[CUTE_INDEX++%animals.length];
  box.querySelector("span").textContent=message;box.classList.remove("show");void box.offsetWidth;box.classList.add("show");
  clearTimeout(CUTE_TIMER);CUTE_TIMER=setTimeout(()=>box.classList.remove("show"),1900);
}
