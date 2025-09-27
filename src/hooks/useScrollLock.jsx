import { useEffect, useRef } from "react";

const useScrollLock = (locked) => {
  const savedScrollYRef = useRef(0);

  useEffect(() => {
    if (!locked) return;
    const { style } = document.body;

    // 현재 스크롤 위치 저장 후 body를 고정시켜 배경 스크롤 완전 차단
    savedScrollYRef.current = window.scrollY || window.pageYOffset || 0;

    const prev = {
      position: style.position,
      top: style.top,
      left: style.left,
      right: style.right,
      width: style.width,
      overflowY: style.overflowY,
      overflow: style.overflow,
    };

    style.position = "fixed";
    style.top = `-${savedScrollYRef.current}px`;
    style.left = "0";
    style.right = "0";
    style.width = "100%";
    style.overflow = "hidden";
    style.overflowY = "hidden";

    return () => {
      style.position = prev.position;
      style.top = prev.top;
      style.left = prev.left;
      style.right = prev.right;
      style.width = prev.width;
      style.overflow = prev.overflow;
      style.overflowY = prev.overflowY;
      // body 고정을 풀고 스크롤 복원
      window.scrollTo(0, savedScrollYRef.current);
    };
  }, [locked]);
};

export default useScrollLock;


