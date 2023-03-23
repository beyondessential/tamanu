package com.tamanuapp.power;


import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.BatteryManager;
import android.os.PowerManager;
import android.os.Build;
import android.provider.Settings;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class PowerModule extends ReactContextBaseJavaModule {

    private final ReactApplicationContext reactContext;

    public PowerModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "PowerModule";
    }

    @ReactMethod
    public void addScreenOnListener() {
        IntentFilter filter = new IntentFilter(Intent.ACTION_SCREEN_ON);
        this.reactContext.registerReceiver(new ScreenOnReceiver(), filter);
    }

    @ReactMethod
    public void addScreenOffListener() {
        IntentFilter filter = new IntentFilter(Intent.ACTION_SCREEN_OFF);
        this.reactContext.registerReceiver(new ScreenOffReceiver(), filter);
    }

    @ReactMethod
    public void removeScreenOnListener() {
        this.reactContext.unregisterReceiver(new ScreenOnReceiver());
    }

    @ReactMethod
    public void removeScreenOffListener() {
        this.reactContext.unregisterReceiver(new ScreenOffReceiver());
    }

    private class ScreenOnReceiver extends android.content.BroadcastReceiver {
        @Override
        public void onReceive(Context context, Intent intent) {
            PowerModule.this.sendEvent("screenOn");
        }
    }

    private class ScreenOffReceiver extends android.content.BroadcastReceiver {
        @Override
        public void onReceive(Context context, Intent intent) {
            PowerModule.this.sendEvent("screenOff");
        }
    }

    private void sendEvent(String eventName) {
        this.reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit(eventName, null);
    }
}
