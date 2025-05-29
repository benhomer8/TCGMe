using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;
using System.Net.Http;
using System.Net.Http.Headers;
using Microsoft.Extensions.Configuration;
using System.Threading.Tasks;
using System;

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

        // Accept raw JSON body from React Native
        [HttpPost("upload")]
        public async Task<IActionResult> UploadPhoto([FromBody] JsonElement requestBody)
        {
            try
            {
                var apiKey = _config["OpenAI:ApiKey"];
                if (string.IsNullOrWhiteSpace(apiKey))
                    return StatusCode(500, "OpenAI API key is not configured.");

                var client = _httpClientFactory.CreateClient();

                var request = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/chat/completions");
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

                // Forward the entire requestBody JSON as-is to OpenAI API
                string jsonString = requestBody.GetRawText();

                request.Content = new StringContent(jsonString, Encoding.UTF8, "application/json");

                var response = await client.SendAsync(request);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"OpenAI error: {response.StatusCode} - {errorContent}");
                    return StatusCode((int)response.StatusCode, errorContent);
                }

                using var responseStream = await response.Content.ReadAsStreamAsync();
                using var jsonDoc = await JsonDocument.ParseAsync(responseStream);
                var caption = jsonDoc.RootElement
                                     .GetProperty("choices")[0]
                                     .GetProperty("message")
                                     .GetProperty("content")
                                     .GetString();

                return Ok(new { caption });
            }
            catch (Exception ex)
            {
                Console.WriteLine("Exception: " + ex);
                return StatusCode(500, "Internal server error");
            }
        }
    }
}
