const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', '12345678', '111111', '123123', 'abc123', 'password1', 'admin',
    'letmein', 'welcome', 'monkey', '1234', '12345', '1q2w3e4r', 'sunshine', 'princess', 'dragon', 'iloveyou',
    'trustno1', '123qwe', 'superman', 'hello', 'freedom', 'whatever', 'qazwsx', '654321', 'jordan23', 'harley',
    'master', 'zaq12wsx', 'baseball', 'football', 'hockey', 'batman', 'passw0rd', 'starwars', 'google', 'letmein123',
    'lovely', 'michael', 'shadow', 'killer', 'donald', 'charlie', 'liverpool', 'cheese', 'soccer', 'merlin',
    '123321', 'ninja', 'mustang', 'maggie', 'cookie', '1111', '123', '121212', '88888888', '654321', '7777777',
    'princess', 'q1w2e3r4t5', 'password!', 'password123!', 'hello123', 'monkey123', 'computer', 'internet', 'flower',
    'daniel', 'secret', 'summer', 'buster', 'yankees', 'rangers', 'dallas', 'tigger', 'pepper', 'success', 'victory',
    'welcome1', 'password123', 'abc', '123abc', 'zaq1', 'zaq1xsw2', 'zaqwsx', 'zaqxsw', 'zaq1!QAZ', 'zaq!2wsx',
    'asdf', 'asdfgh', 'asdf1234', 'asdfghjkl', 'azerty', 'ghjkl', 'mnbvcxz', 'mnbvcx', 'poiuytrewq', 'qwertyuiop',
    'iloveyou123', 'qwe123', '123qwe!', 'qweasdzxc', 'qwertyu', 'love', 'princess1', 'football1', 'batman1', 'superman1',
    'superman123', 'batman123', 'password!', 'password!', '12345!', 'letmein!', 'letmein123!', 'qwert!', 'qwerty123!'
];

const validatePassword = (password) => {
    // Password must be 18-64 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+|~=`{}\[\]:";'<>?,./-])[A-Za-z\d!@#$%^&*()_+|~=`{}\[\]:";'<>?,./-]{18,64}$/;
    
    // Check against common passwords
    if (commonPasswords.includes(password.toLowerCase())) {
        throw new Error("Password is too common. Please choose a more complex password.");
    }
    
    // Check for sequential characters
    if (/(\w)\1{2,}/.test(password)) {
        throw new Error("Password should not contain more than two consecutive identical characters.");
    }
    
    // Check for sequential character sequences (like "abc", "123", etc.)
    const sequentialRegex = /(\d{3,}|\w{3,})/;
    if (sequentialRegex.test(password)) {
        const sequences = password.match(sequentialRegex);
        for (const sequence of sequences) {
            if (isSequential(sequence)) {
                throw new Error("Password should not contain sequential characters (e.g., 'abc', '123').");
            }
        }
    }
    
    if (!passwordRegex.test(password)) {
        throw new Error("Password must be 18-64 characters long and include at least one uppercase letter, one lowercase letter, one digit, and one special character.");
    }
};

// Helper function to check for sequential characters
const isSequential = (str) => {
    let isSequential = true;
    for (let i = 0; i < str.length - 1; i++) {
        if (str.charCodeAt(i) + 1 !== str.charCodeAt(i + 1)) {
            isSequential = false;
            break;
        }
    }
    return isSequential;
};

module.exports = validatePassword;