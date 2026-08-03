#!/usr/bin/env pwsh

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "Murdoch Survey System - Starting..." -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

$ProjectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectDir

Write-Host ""
Write-Host "[1/3] Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Node.js not found!" -ForegroundColor Red
    Write-Host "Please install Node.js 18+ from https://nodejs.org" -ForegroundColor Red
    Write-Host "Then close and reopen this terminal." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "[2/3] Installing dependencies..." -ForegroundColor Yellow
Write-Host "Installing root dependencies..."
npm install
if ($LASTEXITCODE -ne 0) { 
    Write-Host "ERROR: Failed to install root dependencies" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1 
}

Write-Host ""
Write-Host "Installing client dependencies..."
Set-Location client
npm install
if ($LASTEXITCODE -ne 0) { 
    Write-Host "ERROR: Failed to install client dependencies" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1 
}
Set-Location ..

Write-Host ""
Write-Host "[3/3] Starting development servers..." -ForegroundColor Yellow

Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "Server will start shortly..." -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "Frontend:  http://localhost:5173" -ForegroundColor White
Write-Host "Backend:   http://localhost:3000" -ForegroundColor White
Write-Host "Admin:     http://localhost:5173/admin" -ForegroundColor White
Write-Host ""
Write-Host "Default login:" -ForegroundColor Yellow
Write-Host "  Email:    admin@murdoch.edu.au" -ForegroundColor White
Write-Host "  Password: Admin@2024!" -ForegroundColor White
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

npm run dev
