using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.AspNetCore.Hosting;

var builder = WebApplication.CreateBuilder(args);

var config = builder.Configuration;



builder.WebHost.ConfigureKestrel(serverOptions =>
{
    serverOptions.Limits.MinRequestBodyDataRate = null;
    serverOptions.ListenAnyIP(5000); // Allows requests on your local network at port 5000
});

builder.Services.AddControllers();

builder.Services.AddHttpClient();

var app = builder.Build();
//app.UseHttpsRedirection();



app.UseCors("AllowAll");
app.MapControllers();
app.Run();
