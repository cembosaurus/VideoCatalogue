using Microsoft.AspNetCore.Mvc;



namespace VideoCatalogue.Controllers
{

    [Route("[controller]")]
    public class HomeController : Controller
    {


        [HttpGet("")]
        [HttpGet("Index")]
        [HttpGet("/")]
        public IActionResult Index()
        {
            // all data is loaded via JavaScript from /api/media
            return View();
        }
    }
}
