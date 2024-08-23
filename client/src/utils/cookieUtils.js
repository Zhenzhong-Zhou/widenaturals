import Cookies from 'js-cookie';

export const setCookie = (name, value, options = {}) => {
    Cookies.set(name, value, { expires: 7, secure: true, sameSite: 'Strict', ...options });
};

export const getCookie = (name) => {
    return Cookies.get(name);
};

export const removeCookie = (name) => {
    Cookies.remove(name);
};