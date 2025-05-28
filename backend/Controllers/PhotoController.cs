using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;
using System.Net.Http;
using System.Net.Http.Headers;
using Microsoft.Extensions.Configuration;
using System.Threading.Tasks;
using System.IO;
using Microsoft.AspNetCore.Http;
using System;

// PhotoController.cs
// This file is part of the backend for a trading card caption generator using OpenAI's API.
// It handles photo uploads and generates captions using the GPT-4 Vision model.

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PhotoController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _config;

        public PhotoController(IHttpClientFactory httpClientFactory, IConfiguration config)
        {
            _httpClientFactory = httpClientFactory;
            _config = config;
        }

        [HttpPost("upload")]
        public async Task<IActionResult> UploadPhoto(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { error = "Failed to upload file." });


            // Read file into memory
            byte[] imageBytes;
            using (var ms = new MemoryStream())
            {
                await file.CopyToAsync(ms);
                imageBytes = ms.ToArray();
            }

            string base64Image = Convert.ToBase64String(imageBytes);

            var requestBody = new
            {
                model = "gpt-4-vision-preview",
                messages = new[]
                {
                    new {
                        role = "user",
                        content = new object[]
                        {
                            new { type = "text", text = "Generate a cool trading card caption based on this image." },
                            new {
                                type = "image_url",
                                image_url = new {
                                    type = "base64",
                                    data = base64Image
                                }
                            }
                        }
                    }
                },
                max_tokens = 100
            };

            var client = _httpClientFactory.CreateClient();
            var request = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/chat/completions");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _config["OpenAI:ApiKey"]);
            request.Content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

            var response = await client.SendAsync(request);
            if (!response.IsSuccessStatusCode)
                return StatusCode((int)response.StatusCode, "Failed to get caption from OpenAI.");

            var json = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync());
            var caption = json.RootElement
                              .GetProperty("choices")[0]
                              .GetProperty("message")
                              .GetProperty("content")
                              .GetString();

            return Ok(new { caption = "This is a test caption" });
            return Ok(new { caption });
        }
    }
}
