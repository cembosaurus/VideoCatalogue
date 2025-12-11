(function () {
    const catalogueSection = document.getElementById("catalogueSection");
    const uploadSection = document.getElementById("uploadSection");

    const showCatalogueBtn = document.getElementById("showCatalogueBtn");
    const showUploadBtn = document.getElementById("showUploadBtn");

    const catalogueError = document.getElementById("catalogueError");
    const uploadError = document.getElementById("uploadError");
    const uploadSuccess = document.getElementById("uploadSuccess");
    const uploadProgress = document.getElementById("uploadProgress");
    const emptyCatalogueMessage = document.getElementById("emptyCatalogueMessage");

    const catalogueTableBody = document.querySelector("#catalogueTable tbody");

    const videoContainer = document.getElementById("videoContainer");
    const videoPlayer = document.getElementById("videoPlayer");
    const videoSource = document.getElementById("videoSource");
    const currentVideoTitle = document.getElementById("currentVideoTitle");

    const uploadForm = document.getElementById("uploadForm");
    const fileInput = document.getElementById("fileInput");

    function clearMessages() {
        [catalogueError, uploadError, uploadSuccess].forEach(el => {
            el.classList.add("d-none");
            el.textContent = "";
        });
    }



    // switching between views upload/catalogue:

    function showView(view) {
        clearMessages();

        if (view === "catalogue") {
            catalogueSection.classList.remove("d-none");
            uploadSection.classList.add("d-none");
            showCatalogueBtn.classList.replace("btn-outline-secondary", "btn-primary");
            showUploadBtn.classList.replace("btn-primary", "btn-outline-secondary");
        } else {
            uploadSection.classList.remove("d-none");
            catalogueSection.classList.add("d-none");
            showUploadBtn.classList.replace("btn-outline-secondary", "btn-primary");
            showCatalogueBtn.classList.replace("btn-primary", "btn-outline-secondary");
        }
    }


    // loads the catalogue list, created rows and cells:

    async function loadCatalogue() {
        clearMessages();
        emptyCatalogueMessage.classList.add("d-none");
        catalogueTableBody.innerHTML = "";

        try {
            const response = await fetch("/api/media");

            if (!response.ok) {
                catalogueError.textContent = "Failed to load catalogue.";
                catalogueError.classList.remove("d-none");
                return;
            }

            const data = await response.json();

            if (!data || data.length === 0) {
                emptyCatalogueMessage.classList.remove("d-none");
                return;
            }

            data.forEach(item => {
                const tr = document.createElement("tr");
                tr.classList.add("media-row");
                tr.dataset.filename = item.fileName;

                const nameTd = document.createElement("td");
                nameTd.textContent = item.fileName;
                nameTd.classList.add("file-name-cell");

                const sizeTd = document.createElement("td");
                sizeTd.classList.add("text-end");
                sizeTd.textContent = formatSize(item.fileSizeBytes);

                tr.appendChild(nameTd);
                tr.appendChild(sizeTd);
                catalogueTableBody.appendChild(tr);
            });
        } catch (err) {
            catalogueError.textContent = "An unexpected error occurred while loading the catalogue.";
            catalogueError.classList.remove("d-none");
            console.error(err);
        }
    }



    // format the size to human readable format:

    function formatSize(bytes) {
        const num = Number(bytes || 0);

        if (num >= 1024 * 1024) {
            return (num / (1024 * 1024)).toFixed(1) + " MB";
        }
        return (num / 1024).toFixed(1) + " KB";
    }




    // video play:

    function playVideo(fileName) {
        if (!fileName) return;

        // formats the file name, handles spaces, brackets, etc.:
        const url = "/media/" + encodeURIComponent(fileName);

        currentVideoTitle.textContent = fileName;   // show the name above player
        videoSource.src = url;

        videoContainer.classList.remove("d-none");

        videoPlayer.load();
        videoPlayer.play().catch(err => {
            console.warn("Unable to autoplay video:", err);
        });
    }




    // Handles row click event in catalogue table:

    catalogueTableBody.addEventListener("click", (event) => {

        let target = event.target;  // identify element in table that was clicked on

        while (target && target !== catalogueTableBody && target.nodeName !== "TR") {
            target = target.parentElement;
        }

        if (!target || target === catalogueTableBody) return;

        const filename = target.dataset.filename;
        playVideo(filename);
    });




    // after click event, calling showView where switching bethween views is provided:

    showCatalogueBtn.addEventListener("click", () => {
        showView("catalogue");
    });

    showUploadBtn.addEventListener("click", () => {
        showView("upload");
    });




    // UPLOAD the video file:

    uploadForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearMessages();

        if (!fileInput.files || fileInput.files.length === 0) {                 // 'fileInput' - element for browsing the files for upload
            uploadError.textContent = "Please select at least one MP4 file.";
            uploadError.classList.remove("d-none");
            return;
        }


        // buiulds HTTP request BODY for upload, and append FILES into body:

        const formData = new FormData();
        for (const file of fileInput.files) {
            formData.append("files", file);
        }


        uploadProgress.classList.remove("d-none");

        try {
            const response = await fetch("/api/media/upload", {                 // POST the request with formData in BODY
                method: "POST",
                body: formData
            });

            uploadProgress.classList.add("d-none");

            if (response.ok) {
                uploadSuccess.textContent = "Upload successful.";
                uploadSuccess.classList.remove("d-none");
                fileInput.value = "";

                // After successful upload, switch to catalogue and reload it.
                showView("catalogue");
                await loadCatalogue();
            } else {
                let message = "Upload failed.";
                if (response.status === 413) {                                      // file is too large
                    message = "Upload failed: total upload size exceeds 200 MB.";
                } else {
                    try {                                                           // parse error message from server
                        const errorJson = await response.json();
                        if (errorJson && errorJson.message) {
                            message = errorJson.message;
                        }
                    } catch {
                        // Fall back to default message
                    }
                }

                uploadError.textContent = message;
                uploadError.classList.remove("d-none");
                // remain on upload view as per requirements
                showView("upload");
            }
        } catch (err) {                                                             // network error, server unreachable, CORS, etc.
            uploadProgress.classList.add("d-none");
            uploadError.textContent = "An unexpected error occurred during upload.";
            uploadError.classList.remove("d-none");
            console.error(err);
            // remain on upload view
        }
    });



    // Initial page load
    showView("catalogue");
    loadCatalogue();

})();
