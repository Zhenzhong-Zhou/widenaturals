const sendSignal = (signal, pid) => {
    process.kill(pid, signal);
};

module.exports = {
    sendSignal,
};