# VideoCatalogue

A small ASP.NET Core MVC application for browsing and playing MP4 videos from the server file system, and uploading new videos via a simple HTML/JavaScript front end.

The app exposes a minimal Web API (`/api/media`) and a single-page-style UI that lets you:

- List all available videos
- Play a selected video in an HTML `<video>` player
- Upload one or more new `.mp4` files

> **Note:** Sample `.mp4` files are **not** stored in this repository.  
> Put your own test videos in `VideoCatalogue/wwwroot/media` when running locally.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Features](#features)
  - [Catalogue View](#catalogue-view)
  - [Upload View](#upload-view)
  - [Backend](#backend)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Clone and Restore](#clone-and-restore)
  - [Add Test Videos (optional)](#add-test-videos-optional)
  - [Run the Application](#run-the-application)
- [API Overview](#api-overview)
- [Frontend Behaviour (JavaScript)](#frontend-behaviour-javascript)
- [Error Handling](#error-handling)
- [Limitations / Possible Improvements](#limitations--possible-improvements)
- [Notes](#notes)
- [Author](#author)

---

## Architecture Overview

**High-level design:**

- **UI layer:**
  - Razor MVC view (`Views/Home/Index.cshtml`)
  - Bootstrap-based layout and styling
  - Vanilla JavaScript in `wwwroot/js/site.js` for all dynamic behaviour

- **Web API layer:**
  - `MediaController` under `Controllers/Api`
  - REST-style endpoints for listing and uploading media

- **Service layer:**
  - `IMediaService` interface
  - `FileSystemMediaService` implementation encapsulating all file-system access
  - Controllers do *not* work with raw paths directly → easy to swap or test

- **Storage:**
  - MP4 files stored under `wwwroot/media`
  - Served as static files via `/media/{fileName}`

This separation keeps the controller thin, isolates I/O concerns, and makes the app easy to evolve (e.g. switch to cloud storage later).

---

## Features

### Catalogue View

- Lists all `.mp4` files found in the media folder.
- Shows:
  - File name
  - Size in KB/MB (formatted in JS with a `formatSize(bytes)` helper).
- Each table row is tagged with `data-filename="..."` so click handlers know which file to play.
- Clicking a row:
  - Updates the video title
  - Sets the `<source>` of the `<video>` element
  - Shows the player and starts playback

### Upload View

- Select one or more `.mp4` files via `<input type="file" multiple>`.
- Client-side validation:
  - Requires at least one file before submit.
- Uses `FormData` + Fetch API to send a `multipart/form-data` request to `/api/media/upload`.
- Shows:
  - Upload-in-progress indicator
  - Success message when upload completes
  - Detailed error message when upload fails (see [Error Handling](#error-handling)).
- On successful upload:
  - Clears the file input
  - Switches to the catalogue view
  - Reloads the catalogue so new videos appear immediately

### Backend

- **`MediaController`** (`Controllers/Api/MediaController.cs`):
  - `GET /api/media` – returns a JSON list of files (`fileName`, `sizeBytes`).
  - `POST /api/media/upload` – accepts one or more files under the `files` field.
  - Enforces maximum total upload size (e.g. 200 MB via `MaxUploadBytes = 200L * 1024 * 1024`).
  - Returns status `413 Payload Too Large` when the limit is exceeded.

- **`FileSystemMediaService`** (`Services/FileSystemMediaService.cs`):
  - Abstracts all reading/writing of media files.
  - Responsible for:
    - Listing the content of the media directory
    - Combining root path + file names safely
    - Saving uploaded files
  - Makes it easy to change storage implementation or unit test the controller.

- **`MediaFileInfo` model:**
  - Simple DTO containing `FileName` and `SizeBytes` for serialisation to JSON.

---

## Tech Stack

- **Backend**
  - .NET / ASP.NET Core MVC (targeting .NET 8 or your configured version)
  - C#
- **Frontend**
  - Razor views
  - HTML & CSS
  - [Bootstrap](https://getbootstrap.com/) for styling and layout
  - Vanilla JavaScript & Fetch API
- **Storage**
  - File system (local media folder under `wwwroot/media`)

---

## Project Structure

Relevant parts of the repo:

```text
VideoCatalogue.sln

VideoCatalogue/
  Program.cs
  VideoCatalogue.csproj

  Controllers/
    HomeController.cs
    Api/
      MediaController.cs

  Models/
    ErrorViewModel.cs
    MediaFileInfo.cs

  Services/
    IMediaService.cs
    FileSystemMediaService.cs

  Views/
    Home/
      Index.cshtml
      Privacy.cshtml
    Shared/
      _Layout.cshtml
      _Layout.cshtml.css
      _ValidationScriptsPartial.cshtml
      Error.cshtml
    _ViewImports.cshtml
    _ViewStart.cshtml

  wwwroot/
    css/
      site.css
    js/
      site.js           # Catalogue, upload, and video-player logic
    media/              # Place your .mp4 files here (git-ignored)
    lib/
      bootstrap/        # Bootstrap CSS/JS (from the default MVC template)
      jquery/
      jquery-validation/
      jquery-validation-unobtrusive/
```

---

## Getting Started

### Prerequisites

- [.NET SDK](https://dotnet.microsoft.com/en-us/download) installed (matching the project’s target framework)
- Git (optional, for cloning)
- A browser (Chrome, Edge, Firefox, etc.)

### Clone and Restore

```bash
git clone https://github.com/cembosaurus/VideoCatalogue.git
cd VideoCatalogue
dotnet restore
```

### Add Test Videos (optional)

Create the media folder if it doesn’t exist and copy a few `.mp4` files:

```text
VideoCatalogue/wwwroot/media/
    MyVideo1.mp4
    MyVideo2.mp4
```

> This folder is **git-ignored** so your media files are never committed.

### Run the Application

From the repo root:

```bash
dotnet run --project VideoCatalogue
```

By default ASP.NET Core will print URLs such as:

- `https://localhost:5xxx`
- `http://localhost:5yyy`

Open the HTTPS URL in your browser and you should see the VideoCatalogue UI.

Alternatively, open `VideoCatalogue.sln` in Visual Studio or Rider and run the `VideoCatalogue` project from the IDE.

---

## API Overview

The JavaScript frontend talks to a small Web API implemented by `MediaController`.

### `GET /api/media`

Returns a JSON array of media file info:

```json
[
  {
    "fileName": "MyVideo1.mp4",
    "sizeBytes": 1234567
  },
  {
    "fileName": "MyVideo2.mp4",
    "sizeBytes": 2345678
  }
]
```

### `POST /api/media/upload`

- Expects `multipart/form-data`.
- Client sends files under the field name `files`:

  ```js
  const formData = new FormData();
  for (const file of fileInput.files) {
      formData.append("files", file);
  }

  await fetch("/api/media/upload", {
      method: "POST",
      body: formData
  });
  ```

- **Success:**
  - `200 OK` (or similar 2xx)
- **Too large upload:**
  - `413 Payload Too Large`
  - JS shows: “Upload failed: total upload size exceeds 200 MB.”
- **Other validation/processing errors:**
  - Appropriate non-2xx status
  - Optional JSON body `{ "message": "..." }` which the frontend displays if present

---

## Frontend Behaviour (JavaScript)

All client-side behaviour is implemented in `wwwroot/js/site.js`.

Key points:

- **View switching**

  ```js
  showCatalogueBtn.addEventListener("click", () => {
      showView("catalogue");
  });

  showUploadBtn.addEventListener("click", () => {
      showView("upload");
  });
  ```

  `showView(view)` toggles the Bootstrap `d-none` class on the catalogue and upload sections, giving simple single-page-style navigation without full reloads.

- **Loading the catalogue**

  ```js
  const response = await fetch("/api/media");
  const items = await response.json();
  ```

  - Populates the table body (`<tbody>`) with one `<tr>` per file.
  - Each `<tr>` gets `data-filename` set from `item.fileName`.

- **Selecting a video**

  ```js
  catalogueTableBody.addEventListener("click", (event) => {
      // Walk up to the <tr>, read dataset.filename, call playVideo(filename)
  });
  ```

- **Playing a video**

  ```js
  function playVideo(fileName) {
      const url = "/media/" + encodeURIComponent(fileName);
      currentVideoTitle.textContent = fileName;
      videoSource.src = url;
      videoContainer.classList.remove("d-none");
      videoPlayer.load();
      videoPlayer.play().catch(err => console.warn("Unable to autoplay video:", err));
  }
  ```

  - Builds a relative URL `/media/{fileName}` → browser resolves it against current origin.
  - Updates the `<video>` source and starts playback.

- **Uploading files**

  ```js
  uploadForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      // validate fileInput.files.length > 0
      // build FormData, show progress, POST to /api/media/upload, handle response
  });
  ```

  - Uses `fetch` with `FormData` to stream files to the backend.
  - On success:
    - Shows success message
    - Clears the file input
    - Switches to the catalogue view
    - Calls `loadCatalogue()` to refresh the list

---

## Error Handling

The upload logic distinguishes between several cases:

- **Client-side validation:**
  - If no files selected, form is not submitted; an inline error is shown.

- **HTTP errors:**
  - `413` → displays “Upload failed: total upload size exceeds 200 MB.”
  - Other non-OK responses:
    - Attempts to parse `response.json()`
    - If `{ "message": "..." }` exists, that message is shown
    - Otherwise, a generic “Upload failed.” is displayed

- **Network / unexpected errors:**
  - Caught by `try/catch` around `fetch`
  - Progress indicator is hidden
  - Shows “An unexpected error occurred during upload.”
  - Logs the error to the console for debugging

The catalogue load path can be extended with similar error handling if required.

---

## Limitations / Possible Improvements

Some ideas for future work:

- Add unit tests for `FileSystemMediaService` and `MediaController`.
- Support subfolders or categories for videos.
- Add simple search/filter in the catalogue view.
- Show video duration and thumbnail (e.g. pre-generated or via a metadata library).
- Replace local file-system storage with cloud storage (e.g. S3, Azure Blob) behind the same `IMediaService` interface.
- Add basic authentication/authorization if required in a real deployment.

---

## Notes

- `VideoCatalogue/wwwroot/media/` is **ignored** by `.gitignore` to avoid committing binary video content.
- The project is intended as a small, clear example of:
  - ASP.NET Core MVC + minimal Web API
  - Separation via service layer (`IMediaService` / `FileSystemMediaService`)
  - Clean, framework-agnostic JavaScript using the Fetch API

---

## Author

**Miloš**  
GitHub: [@cembosaurus](https://github.com/cembosaurus)
