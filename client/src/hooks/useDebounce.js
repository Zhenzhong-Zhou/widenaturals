import {useCallback, useRef} from "react";

const useDebounce = (callback, delay) => {
    const timerRef = useRef();

    return useCallback((...args) => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        timerRef.current = setTimeout(() => {
            callback(...args);
        }, delay);
    }, [callback, delay]);
};

export default useDebounce;