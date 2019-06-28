export const SANITIZATION_FILE_TYPES = [
    'bmp',
    'doc',
    'docm',
    'docx',
    'dot',
    'dotm',
    'dotx',
    'dwg',
    'gif',
    'htm',
    'html',
    'hwp',
    'jpg',
    'jpeg',
    'jtd',
    'pdf',
    'png',
    'ppsx',
    'ppt',
    'pptm',
    'pptx',
    'rtf',
    'tif',
    'tiff',
    'xls',
    'xlsb',
    'xlsm',
    'xlsx',
    'xml'
];

export const SCAN_STATUS = {
    VALUES: {
        SCANNING: 0,
        CLEAN: 1,
        INFECTED: 2,
        UNKNOWN: 3
    },
    CLEAN_VALUES: [0, 4, 7],
    INFECTED_VALUES: [1, 2, 6, 8, 18] 
};
