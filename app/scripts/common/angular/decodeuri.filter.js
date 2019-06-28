'use strict';

function decodeFileName(fileName) {
    try {
        return decodeURI(fileName);
    } catch (error) {
        return fileName;
    }
}

export default decodeFileName;