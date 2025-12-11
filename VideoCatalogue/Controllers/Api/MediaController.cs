using Microsoft.AspNetCore.Mvc;
using VideoCatalogue.Models;
using VideoCatalogue.Services;



namespace VideoCatalogue.Controllers.Api
{

    [ApiController]
    [Route("api/[controller]")]
    public class MediaController : ControllerBase
    {

        private const long MaxUploadBytes = 200L * 1024 * 1024; // 200 MB
        private readonly IMediaService _mediaService;


        public MediaController(IMediaService mediaService)
        {
            _mediaService = mediaService;
        }




        [HttpGet]
        public ActionResult<IEnumerable<MediaFileInfo>> Get()
        {
            var files = _mediaService.GetAllMediaFiles();
            return Ok(files);
        }



        // Limit to 200 MB ONLY for this endpoint.
        [HttpPost("upload")]
        [RequestSizeLimit(MaxUploadBytes)]
        [RequestFormLimits(MultipartBodyLengthLimit = MaxUploadBytes)]
        public async Task<IActionResult> Upload([FromForm] List<IFormFile> files)
        {
            if (files == null || files.Count == 0)
            {
                return BadRequest(new { message = "No files uploaded." });
            }

            // Validate file types
            foreach (var file in files)
            {
                if (!_mediaService.IsValidMediaFile(file))
                {
                    return BadRequest(new
                    {
                        message = $"Invalid file type. Only MP4 files are allowed. Offending file: {file.FileName}"
                    });
                }
            }

            try
            {
                await _mediaService.SaveMediaFilesAsync(files);
            }
            catch (Exception ex)
            {
                // In a real app you'd log this
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    message = "An error occurred while saving the files.",
                    detail = ex.Message
                });
            }

            return Ok(new { message = "Upload successful." });
        }
    }
}
