# syntax=docker/dockerfile:1
# Build context: the repository root (see docker-compose.yml); .editorconfig holds analyzer settings.

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY .editorconfig ./
COPY backend/Directory.Build.props backend/
COPY backend/src/ComputerInventory.Api/ComputerInventory.Api.csproj backend/src/ComputerInventory.Api/
# Restore first, in its own layer: it's only redone when the project file changes.
RUN dotnet restore backend/src/ComputerInventory.Api/ComputerInventory.Api.csproj
COPY backend/src/ backend/src/
RUN dotnet publish backend/src/ComputerInventory.Api -c Release -o /app --no-restore -p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
# curl is only for the container health check.
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /app .
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080
# Non-root user provided by the .NET images.
USER $APP_UID
ENTRYPOINT ["dotnet", "ComputerInventory.Api.dll"]
