using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.IO;
using System.Threading.Tasks;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PhotoController : ControllerBase
    {
        [HttpPost("upload")]
        public async Task<IActionResult> UploadPhoto(IFormFile file)
        {
            Console.WriteLine("getting file");
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded.");

            // Optional: Save file temporarily (or process as needed)
            var filePath = Path.Combine(Path.GetTempPath(), file.FileName);

            using (var stream = System.IO.File.Create(filePath))
            {
                await file.CopyToAsync(stream);
            }

            // TODO: Process file for caption generation (call your LLM here)

            // For now, just return a sample caption
            return Ok(new { caption = "Pernus" });
        }
    }
}
