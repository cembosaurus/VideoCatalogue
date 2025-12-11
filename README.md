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
