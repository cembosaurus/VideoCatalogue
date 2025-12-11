using VideoCatalogue.Models;



namespace VideoCatalogue.Services
{
    public class FileSystemMediaService : IMediaService
    {

        private readonly string _mediaRoot;


        public FileSystemMediaService(IWebHostEnvironment env)
        {
            _mediaRoot = Path.Combine(env.WebRootPath, "media");
            Directory.CreateDirectory(_mediaRoot);
        }




        public IReadOnlyCollection<MediaFileInfo> GetAllMediaFiles()
        {
            if (!Directory.Exists(_mediaRoot))
            {
                return Array.Empty<MediaFileInfo>();
            }

            var files = Directory.EnumerateFiles(_mediaRoot, "*.mp4", SearchOption.TopDirectoryOnly);

            return files
                .Select(path => new FileInfo(path))
                .Select(fi => new MediaFileInfo
                {
                    FileName = fi.Name,
                    FileSizeBytes = fi.Length
                })
                .OrderBy(f => f.FileName)
                .ToList();
        }



        public bool IsValidMediaFile(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return false;

            var extension = Path.GetExtension(file.FileName);
            return string.Equals(extension, ".mp4", StringComparison.OrdinalIgnoreCase);
        }



        public async Task SaveMediaFilesAsync(IEnumerable<IFormFile> files)
        {
            foreach (var file in files)
            {
                var safeFileName = Path.GetFileName(file.FileName); // mitigate path traversal
                var destinationPath = Path.Combine(_mediaRoot, safeFileName);

                await using var stream = new FileStream(destinationPath, FileMode.Create);
                await file.CopyToAsync(stream);
            }
        }



        public string GetMediaUrl(string fileName)
        {
            // This is what the browser uses: same origin, static file
            return $"/media/{Uri.EscapeDataString(fileName)}";
        }


    }
}
