package com.tamanuapp.memory;

import android.app.ActivityManager;
import android.content.Context;
import android.os.Build;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;

import java.util.HashMap;
import java.util.Map;

public class MemoryInfoModule extends ReactContextBaseJavaModule {

  public MemoryInfoModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return "MemoryInfo";
  }

  @Override
  public Map<String, Object> getConstants() {
    final Map<String, Object> constants = new HashMap<>();
    ActivityManager activityManager = (ActivityManager) getReactApplicationContext()
        .getSystemService(Context.ACTIVITY_SERVICE);

    int memoryClass = activityManager != null ? activityManager.getMemoryClass() : 0;
    boolean isLowRamDevice = false;
    if (activityManager != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
      isLowRamDevice = activityManager.isLowRamDevice();
    }

    constants.put("memoryClass", memoryClass); // in MB
    constants.put("isLowRamDevice", isLowRamDevice);
    return constants;
  }

  @ReactMethod
  public void getMemoryUsage(Promise promise) {
    try {
      Runtime rt = Runtime.getRuntime();
      long max = rt.maxMemory();
      long used = rt.totalMemory() - rt.freeMemory();
      WritableMap map = Arguments.createMap();
      map.putDouble("maxBytes", (double) max);
      map.putDouble("usedBytes", (double) used);
      promise.resolve(map);
    } catch (Exception e) {
      promise.reject("E_MEMORY", e);
    }
  }
}


