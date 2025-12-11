namespace VideoCatalogue.Models
{
    public class MediaFileInfo
    {

        public string FileName { get; set; } = default!;
        public long FileSizeBytes { get; set; }


        // provides formatted sizes in Razor
        public string FileSizeDisplay =>
            FileSizeBytes >= 1024 * 1024
                ? $"{FileSizeBytes / (1024.0 * 1024.0):0.0} MB"
                : $"{FileSizeBytes / 1024.0:0.0} KB";
    }
}
