package com.tamanuapp;

import android.content.Context;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Downloads the update package, resuming from whatever a previous attempt left behind.
 *
 * The partial download lives in the app's own files directory, so it survives the app being closed
 * and is removed with the app's data. A completed download is renamed into place only once its
 * length matches the length the server declared, so a truncated download is never handed to the
 * installer.
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

    public long downloadedBytes() {
        File complete = completeFile();
        if (complete.exists()) {
            return complete.length();
        }
        File partial = partialFile();
        return partial.exists() ? partial.length() : 0;
    }

    public boolean hasCompletedDownload() {
        return completeFile().exists();
    }

    public void cancel() {
        cancelled.set(true);
    }

    public void clear() {
        partialFile().delete();
        completeFile().delete();
    }

    /**
     * The size the server declares for the package, without downloading it, so free space can be
     * checked before committing to the download. Returns -1 where the server declares no size.
     */
    public long declaredSize(String url) throws IOException {
        HttpURLConnection connection = (HttpURLConnection) new URL(url).openConnection();
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
        long resumeFrom = partial.exists() ? partial.length() : 0;

        HttpURLConnection connection = (HttpURLConnection) new URL(url).openConnection();
        connection.setConnectTimeout(CONNECT_TIMEOUT_MS);
        connection.setReadTimeout(READ_TIMEOUT_MS);
        if (resumeFrom > 0) {
            connection.setRequestProperty("Range", "bytes=" + resumeFrom + "-");
        }

        try {
            connection.connect();
            int status = connection.getResponseCode();

            boolean isResuming = status == HttpURLConnection.HTTP_PARTIAL;
            if (!isResuming && status != HttpURLConnection.HTTP_OK) {
                throw new IOException("Update server responded " + status);
            }

            // A server that ignores the range request sends the whole package back, so anything
            // already on disk is the start of that same package and has to be thrown away.
            if (resumeFrom > 0 && !isResuming) {
                partial.delete();
                resumeFrom = 0;
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
            return complete;
        } finally {
            connection.disconnect();
        }
    }
}
