package com.tamanuapp;

import android.os.Handler;
import android.os.HandlerThread;
import android.os.Looper;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Callback;

public class BackgroundThreadModule extends ReactContextBaseJavaModule {
    private static final String MODULE_NAME = "BackgroundThread";
    private Handler backgroundHandler;
    private Handler mainHandler;
    private HandlerThread backgroundThread;

    public BackgroundThreadModule(ReactApplicationContext context) {
        super(context);
        
        backgroundThread = new HandlerThread("BackgroundThread");
        backgroundThread.start();
        backgroundHandler = new Handler(backgroundThread.getLooper());
        mainHandler = new Handler(Looper.getMainLooper());
    }

    @Override
    public String getName() {
        return MODULE_NAME;
    }

    @ReactMethod
    public void runOnBackgroundThread(final Callback callback) {
        backgroundHandler.post(new Runnable() {
            @Override
            public void run() {
                mainHandler.post(new Runnable() {
                    @Override
                    public void run() {
                        callback.invoke();
                    }
                });
            }
        });
    }

    @Override
    public void onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy();
        if (backgroundThread != null) {
            backgroundThread.quit();
        }
    }
}
