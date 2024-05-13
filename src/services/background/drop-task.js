(function() {
    function processFileInputs(inputs) {
        inputs.forEach(input => {
            input.addEventListener('change', function(event) {
                const file = event.target.files[0];
                console.log('File uploaded:', file.name);
            });
        });
    }

    if (typeof document === 'undefined') {
        console.log('Script loaded, but not in the desired context.');
        return;
    }

    const fileInputs = document.querySelectorAll('input[type="file"]');
    processFileInputs(fileInputs);

    const frames = document.querySelectorAll('iframe');
    frames.forEach(frame => {
        try {
            const frameDocument = frame.contentDocument || frame.contentWindow.document;
            const frameFileInputs = frameDocument.querySelectorAll('input[type="file"]');
            processFileInputs(frameFileInputs);
        } catch (error) {
            console.error('Error processing file inputs in frame:', error);
        }
    });
})();
