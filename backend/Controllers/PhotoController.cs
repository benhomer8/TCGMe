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
                Console.WriteLine("Received request body:");
                var apiKey = "Omitted for Github";
                if (string.IsNullOrWhiteSpace(apiKey))
                    return StatusCode(500, "OpenAI API key is not configured.");
                    
                // Extract "messages" from the bound requestBody
                if (!requestBody.TryGetProperty("messages", out var messages))
                    return BadRequest(new { error = "Missing 'messages' in request body." });

                // Build the new request body including model and max_tokens
                var openAiPayload = new
                {
                    model = "gpt-4.1-nano-2025-04-14",
                    messages = messages,
                    max_tokens = 100,
                };

                var jsonString = JsonSerializer.Serialize(openAiPayload);

                // Create OpenAI API request
                var client = _httpClientFactory.CreateClient();
                var request = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/chat/completions")
                {
                    Headers = { Authorization = new AuthenticationHeaderValue("Bearer", apiKey) },
                    Content = new StringContent(jsonString, Encoding.UTF8, "application/json")
                };

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
