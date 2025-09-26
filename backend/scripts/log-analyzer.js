#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOGS_DIR = path.join(__dirname, '..', 'logs');

/**
 * Log analyzer for booking system
 */
class LogAnalyzer {
  constructor() {
    this.stats = {
      totalRequests: 0,
      errors: 0,
      bookingErrors: 0,
      calendarErrors: 0,
      validationErrors: 0,
      dbErrors: 0,
      performanceIssues: 0,
      topErrors: new Map(),
      slowestRequests: [],
      hourlyStats: new Map(),
    };
  }

  /**
   * Analyze logs for a specific date
   */
  async analyzeLogs(date = null) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    console.log(`🔍 Analyzing logs for ${targetDate}`);

    const logFiles = this.getLogFiles(targetDate);

    if (logFiles.length === 0) {
      console.log(`❌ No log files found for ${targetDate}`);
      return;
    }

    console.log(`📁 Found ${logFiles.length} log files to analyze`);

    for (const logFile of logFiles) {
      await this.processLogFile(logFile);
    }

    this.generateReport();
  }

  /**
   * Get log files for a specific date
   */
  getLogFiles(date) {
    const files = [];

    try {
      const allFiles = fs.readdirSync(LOGS_DIR);

      for (const file of allFiles) {
        if (file.includes(date) && file.endsWith('.log')) {
          files.push(path.join(LOGS_DIR, file));
        }
      }
    } catch (error) {
      console.error('Error reading logs directory:', error.message);
    }

    return files;
  }

  /**
   * Process a single log file
   */
  async processLogFile(filePath) {
    console.log(`📄 Processing ${path.basename(filePath)}...`);

    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    let lineCount = 0;
    for await (const line of rl) {
      lineCount++;
      try {
        const logEntry = JSON.parse(line);
        this.processLogEntry(logEntry);
      } catch (error) {
        // Skip invalid JSON lines
        continue;
      }
    }

    console.log(`   ✅ Processed ${lineCount} lines`);
  }

  /**
   * Process a single log entry
   */
  processLogEntry(entry) {
    this.stats.totalRequests++;

    // Track hourly stats
    if (entry.timestamp) {
      const hour = new Date(entry.timestamp).getHours();
      const hourKey = `${hour}:00`;
      this.stats.hourlyStats.set(hourKey, (this.stats.hourlyStats.get(hourKey) || 0) + 1);
    }

    // Analyze by log level
    if (entry.level === 'error') {
      this.stats.errors++;
      this.trackTopError(entry.message);
    }

    // Analyze by category
    if (entry.category) {
      switch (entry.category) {
        case 'booking':
          if (entry.level === 'error') this.stats.bookingErrors++;
          break;
        case 'calendar':
          if (entry.level === 'error') this.stats.calendarErrors++;
          break;
        case 'validation':
          if (entry.level === 'error' || entry.level === 'warn') this.stats.validationErrors++;
          break;
        case 'database':
          if (entry.level === 'error') this.stats.dbErrors++;
          break;
      }
    }

    // Track performance issues
    if (entry.responseTime && entry.responseTime > 3000) {
      this.stats.performanceIssues++;
      this.stats.slowestRequests.push({
        url: entry.url,
        method: entry.method,
        responseTime: entry.responseTime,
        timestamp: entry.timestamp,
      });
    }
  }

  /**
   * Track top errors
   */
  trackTopError(message) {
    const errorKey = message.substring(0, 100); // First 100 chars
    this.stats.topErrors.set(errorKey, (this.stats.topErrors.get(errorKey) || 0) + 1);
  }

  /**
   * Generate analysis report
   */
  generateReport() {
    console.log('\n📊 LOG ANALYSIS REPORT');
    console.log('='.repeat(50));

    // Basic stats
    console.log(`\n📈 Basic Statistics:`);
    console.log(`   Total log entries: ${this.stats.totalRequests}`);
    console.log(`   Total errors: ${this.stats.errors}`);
    console.log(`   Error rate: ${((this.stats.errors / this.stats.totalRequests) * 100).toFixed(2)}%`);

    // Error breakdown
    console.log(`\n🚨 Error Breakdown:`);
    console.log(`   Booking errors: ${this.stats.bookingErrors}`);
    console.log(`   Calendar errors: ${this.stats.calendarErrors}`);
    console.log(`   Validation errors: ${this.stats.validationErrors}`);
    console.log(`   Database errors: ${this.stats.dbErrors}`);

    // Performance issues
    console.log(`\n⚡ Performance:`);
    console.log(`   Slow requests (>3s): ${this.stats.performanceIssues}`);

    // Top errors
    if (this.stats.topErrors.size > 0) {
      console.log(`\n🔥 Top 5 Errors:`);
      const sortedErrors = Array.from(this.stats.topErrors.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      sortedErrors.forEach(([error, count], index) => {
        console.log(`   ${index + 1}. (${count}x) ${error}`);
      });
    }

    // Slowest requests
    if (this.stats.slowestRequests.length > 0) {
      console.log(`\n🐌 Slowest Requests:`);
      const slowest = this.stats.slowestRequests
        .sort((a, b) => b.responseTime - a.responseTime)
        .slice(0, 5);

      slowest.forEach((req, index) => {
        console.log(`   ${index + 1}. ${req.method} ${req.url} - ${req.responseTime}ms`);
      });
    }

    // Hourly distribution
    if (this.stats.hourlyStats.size > 0) {
      console.log(`\n⏰ Hourly Request Distribution:`);
      const sortedHours = Array.from(this.stats.hourlyStats.entries())
        .sort((a, b) => parseInt(a[0]) - parseInt(b[0]));

      sortedHours.forEach(([hour, count]) => {
        const bar = '█'.repeat(Math.ceil(count / 10));
        console.log(`   ${hour.padStart(5)} | ${count.toString().padStart(4)} | ${bar}`);
      });
    }

    console.log('\n' + '='.repeat(50));
  }

  /**
   * Monitor logs in real-time
   */
  async monitorRealTime() {
    console.log('🔴 Starting real-time log monitoring...');
    console.log('Press Ctrl+C to stop\n');

    const logFile = path.join(LOGS_DIR, `combined-${new Date().toISOString().split('T')[0]}.log`);

    if (!fs.existsSync(logFile)) {
      console.log(`❌ Log file not found: ${logFile}`);
      return;
    }

    const { spawn } = await import('child_process');
    const tail = spawn('tail', ['-f', logFile]);

    tail.stdout.on('data', (data) => {
      const lines = data.toString().split('\n').filter(line => line.trim());

      lines.forEach(line => {
        try {
          const entry = JSON.parse(line);
          this.displayRealTimeEntry(entry);
        } catch (error) {
          // Skip invalid JSON
        }
      });
    });

    tail.stderr.on('data', (data) => {
      console.error(`Error: ${data}`);
    });
  }

  /**
   * Display real-time log entry
   */
  displayRealTimeEntry(entry) {
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const level = entry.level.toUpperCase().padEnd(5);

    let color = '\x1b[0m'; // Reset
    if (entry.level === 'error') color = '\x1b[31m'; // Red
    else if (entry.level === 'warn') color = '\x1b[33m'; // Yellow
    else if (entry.level === 'info') color = '\x1b[32m'; // Green

    const category = entry.category ? `[${entry.category.toUpperCase()}]` : '';

    console.log(`${color}${timestamp} ${level} ${category} ${entry.message}\x1b[0m`);

    // Show additional context for errors
    if (entry.level === 'error' && entry.error) {
      console.log(`   ↳ ${entry.error.message || entry.error}`);
    }
  }
}

// CLI interface
const analyzer = new LogAnalyzer();

const command = process.argv[2];
const date = process.argv[3];

switch (command) {
  case 'analyze':
    await analyzer.analyzeLogs(date);
    break;
  case 'monitor':
    await analyzer.monitorRealTime();
    break;
  default:
    console.log('📚 Booking CRM Log Analyzer');
    console.log('\nUsage:');
    console.log('  node log-analyzer.js analyze [YYYY-MM-DD]  - Analyze logs for specific date');
    console.log('  node log-analyzer.js monitor               - Monitor logs in real-time');
    console.log('\nExamples:');
    console.log('  node log-analyzer.js analyze 2024-01-15');
    console.log('  node log-analyzer.js analyze               # Today\'s logs');
    console.log('  node log-analyzer.js monitor');
    break;
}
