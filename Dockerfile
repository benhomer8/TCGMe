# ---------- Stage 1: Build ----------
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Copy csproj and restore
COPY *.csproj ./
RUN dotnet restore

# Copy all other files and publish
COPY . ./
RUN dotnet publish -c Release -o out

# ---------- Stage 2: Run ----------
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/out .

# Expose port and run app
EXPOSE 5000
ENTRYPOINT ["dotnet", "backend.dll"]
