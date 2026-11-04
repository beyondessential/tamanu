package com.tamanuapp;

import android.content.Context;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Downloads the update package, resuming from whatever a previous attempt left behind.
 *
 * The partial download lives in the app's own files directory, so it survives the app being closed
 * and is removed with the app's data. A completed download is renamed into place only once its
 * length matches the length the server declared, so a truncated download is never handed to the
 * installer.
 *
 * A partial download is only resumed if it came from the same address and the server confirms the
 * package has not changed since (HTTP If-Range); otherwise the bytes already on disk belong to a
 * different package and the download starts again.
 */
public class UpdateDownloader {

    public interface ProgressListener {
        void onProgress(long downloadedBytes, long totalBytes);
    }

    public static class TruncatedDownloadException extends IOException {
        TruncatedDownloadException(long actualBytes, long declaredBytes) {
            super("Download finished at " + actualBytes + " bytes, server declared " + declaredBytes);
        }
    }

    private static final String DOWNLOAD_DIRECTORY = "update";
    private static final String PARTIAL_FILE = "tamanu.apk.part";
    private static final String COMPLETE_FILE = "tamanu.apk";
    private static final String PARTIAL_SOURCE_FILE = "tamanu.apk.part.source";
    private static final int BUFFER_SIZE = 64 * 1024;
    private static final int CONNECT_TIMEOUT_MS = 30 * 1000;
    private static final int READ_TIMEOUT_MS = 60 * 1000;

    private final Context context;
    private final AtomicBoolean cancelled = new AtomicBoolean(false);

    public UpdateDownloader(Context context) {
        this.context = context;
    }

    private File directory() {
        File directory = new File(context.getFilesDir(), DOWNLOAD_DIRECTORY);
        if (!directory.exists()) {
            directory.mkdirs();
        }
        return directory;
    }

    public File partialFile() {
        return new File(directory(), PARTIAL_FILE);
    }

    public File completeFile() {
        return new File(directory(), COMPLETE_FILE);
    }

    private File partialSourceFile() {
        return new File(directory(), PARTIAL_SOURCE_FILE);
    }

    /**
     * What the partial download was started from: its address and the server's validator for the
     * package (an ETag or Last-Modified date), so a resume can be checked against the same package.
     */
    private void recordPartialSource(String url, String validator) throws IOException {
        String contents = url + "\n" + (validator == null ? "" : validator);
        Files.write(partialSourceFile().toPath(), contents.getBytes(StandardCharsets.UTF_8));
    }

    /** The validator to resume with, or null where the partial download cannot be safely resumed. */
    private String resumableValidator(String url) {
        File source = partialSourceFile();
        if (!source.exists()) {
            return null;
        }
        try {
            List<String> lines = Files.readAllLines(source.toPath(), StandardCharsets.UTF_8);
            if (lines.size() < 2 || !url.equals(lines.get(0)) || lines.get(1).isEmpty()) {
                return null;
            }
            return lines.get(1);
        } catch (IOException e) {
            return null;
        }
    }

    /** A strong ETag, else Last-Modified: the forms If-Range accepts. */
    private static String validatorOf(HttpURLConnection connection) {
        String etag = connection.getHeaderField("ETag");
        if (etag != null && !etag.startsWith("W/")) {
            return etag;
        }
        return connection.getHeaderField("Last-Modified");
    }

    public long downloadedBytes() {
        File complete = completeFile();
        if (complete.exists()) {
            return complete.length();
        }
        File partial = partialFile();
        return partial.exists() ? partial.length() : 0;
    }

    /**
     * Whether a downloaded package is ready to install. One that would not move the app forward is
     * left over from an update already installed, or is unreadable, so it is discarded rather than
     * offered again. This holds even if the clean-up after an install never ran.
     */
    public boolean hasCompletedDownload() {
        File complete = completeFile();
        if (!complete.exists()) {
            return false;
        }
        if (isNewerThanInstalled(complete)) {
            return true;
        }
        complete.delete();
        return false;
    }

    private boolean isNewerThanInstalled(File packageFile) {
        PackageManager packageManager = context.getPackageManager();
        PackageInfo downloaded = packageManager.getPackageArchiveInfo(packageFile.getPath(), 0);
        if (downloaded == null) {
            return false;
        }
        try {
            PackageInfo installed = packageManager.getPackageInfo(context.getPackageName(), 0);
            return downloaded.getLongVersionCode() > installed.getLongVersionCode();
        } catch (PackageManager.NameNotFoundException e) {
            return false;
        }
    }

    /**
     * The package is executable, so it is only fetched over an encrypted connection. Debug builds
     * may use plain HTTP, for testing against local servers.
     */
    private static URL secureUrl(String url) throws IOException {
        URL parsed = new URL(url);
        if (!"https".equalsIgnoreCase(parsed.getProtocol()) && !BuildConfig.DEBUG) {
            throw new IOException("Refusing to download the update over an unencrypted connection");
        }
        return parsed;
    }

    public void cancel() {
        cancelled.set(true);
    }

    public void clear() {
        partialFile().delete();
        partialSourceFile().delete();
        completeFile().delete();
    }

    /**
     * The size the server declares for the package, without downloading it, so free space can be
     * checked before committing to the download. Returns -1 where the server declares no size.
     */
    public long declaredSize(String url) throws IOException {
        HttpURLConnection connection = (HttpURLConnection) secureUrl(url).openConnection();
        connection.setConnectTimeout(CONNECT_TIMEOUT_MS);
        connection.setReadTimeout(READ_TIMEOUT_MS);
        connection.setRequestMethod("HEAD");
        try {
            connection.connect();
            int status = connection.getResponseCode();
            if (status != HttpURLConnection.HTTP_OK) {
                throw new IOException("Update server responded " + status);
            }
            return connection.getContentLengthLong();
        } finally {
            connection.disconnect();
        }
    }

    /**
     * Downloads the package, resuming a partial file where one is present. Returns the completed
     * file. A server that ignores the range request restarts the download from the beginning.
     */
    public File download(String url, ProgressListener listener) throws IOException {
        cancelled.set(false);

        if (hasCompletedDownload()) {
            File complete = completeFile();
            listener.onProgress(complete.length(), complete.length());
            return complete;
        }

        File partial = partialFile();
        String validator = resumableValidator(url);
        long resumeFrom = partial.exists() && validator != null ? partial.length() : 0;
        if (resumeFrom == 0) {
            partial.delete();
        }

        HttpURLConnection connection = (HttpURLConnection) secureUrl(url).openConnection();
        connection.setConnectTimeout(CONNECT_TIMEOUT_MS);
        connection.setReadTimeout(READ_TIMEOUT_MS);
        if (resumeFrom > 0) {
            connection.setRequestProperty("Range", "bytes=" + resumeFrom + "-");
            // The server sends the whole package instead if it has changed since the part was fetched
            connection.setRequestProperty("If-Range", validator);
        }

        try {
            connection.connect();
            int status = connection.getResponseCode();

            boolean isResuming = status == HttpURLConnection.HTTP_PARTIAL;
            if (!isResuming && status != HttpURLConnection.HTTP_OK) {
                throw new IOException("Update server responded " + status);
            }

            // A whole package back means the server ignored the range or the package has changed, so
            // anything already on disk has to be thrown away and the new package recorded.
            if (!isResuming) {
                partial.delete();
                resumeFrom = 0;
                recordPartialSource(url, validatorOf(connection));
            }

            long remainingBytes = connection.getContentLengthLong();
            long totalBytes = remainingBytes < 0 ? -1 : resumeFrom + remainingBytes;

            long downloadedBytes = resumeFrom;
            try (InputStream input = connection.getInputStream();
                 FileOutputStream output = new FileOutputStream(partial, resumeFrom > 0)) {
                byte[] buffer = new byte[BUFFER_SIZE];
                int read;
                listener.onProgress(downloadedBytes, totalBytes);
                while ((read = input.read(buffer)) != -1) {
                    if (cancelled.get()) {
                        throw new IOException("Download cancelled");
                    }
                    output.write(buffer, 0, read);
                    downloadedBytes += read;
                    listener.onProgress(downloadedBytes, totalBytes);
                }
                output.getFD().sync();
            }

            if (totalBytes > 0 && downloadedBytes != totalBytes) {
                partial.delete();
                throw new TruncatedDownloadException(downloadedBytes, totalBytes);
            }

            File complete = completeFile();
            complete.delete();
            if (!partial.renameTo(complete)) {
                throw new IOException("Could not move the downloaded package into place");
            }
            partialSourceFile().delete();
            return complete;
        } finally {
            connection.disconnect();
        }
    }
}
