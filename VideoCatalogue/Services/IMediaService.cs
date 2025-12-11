using Microsoft.AspNetCore.Http;
using VideoCatalogue.Models;

namespace VideoCatalogue.Services
{
    public interface IMediaService
    {
        IReadOnlyCollection<MediaFileInfo> GetAllMediaFiles();
        bool IsValidMediaFile(IFormFile file);
        Task SaveMediaFilesAsync(IEnumerable<IFormFile> files);
        string GetMediaUrl(string fileName);
    }
}
