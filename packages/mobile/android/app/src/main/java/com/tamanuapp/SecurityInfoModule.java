package com.tamanuapp;

import android.app.admin.DevicePolicyManager;
import android.content.Context;
import android.app.KeyguardManager;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;

public class SecurityInfoModule extends ReactContextBaseJavaModule {

    public SecurityInfoModule(ReactApplicationContext context) {
        super(context);
    }

    @Override
    public String getName() {
        return "SecurityInfo";
    }

    @ReactMethod
    public void getStorageEncryptionStatus(Promise promise) {
        try {
            DevicePolicyManager devicePolicyManager = (DevicePolicyManager) getReactApplicationContext().getSystemService(Context.DEVICE_POLICY_SERVICE);
            
            if (devicePolicyManager == null) {
                promise.reject("DEVICE_POLICY_MANAGER_NULL", "DevicePolicyManager is not available");
                return;
            }

            int encryptionStatus = devicePolicyManager.getStorageEncryptionStatus();
            
            WritableMap result = Arguments.createMap();
            result.putInt("status", encryptionStatus);
            result.putString("statusText", getEncryptionStatusText(encryptionStatus));
            
            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("ENCRYPTION_STATUS_ERROR", "Failed to get storage encryption status", e);
        }
    }

    @ReactMethod
    public void isDeviceSecure(Promise promise) {
        try {
            KeyguardManager keyguardManager = (KeyguardManager) getReactApplicationContext().getSystemService(Context.KEYGUARD_SERVICE);
            
            if (keyguardManager == null) {
                promise.reject("KEYGUARD_MANAGER_NULL", "KeyguardManager is not available");
                return;
            }

            boolean isSecure = keyguardManager.isDeviceSecure();
            
            promise.resolve(isSecure);
        } catch (Exception e) {
            promise.reject("DEVICE_SECURE_ERROR", "Failed to check if device is secure", e);
        }
    }

    private String getEncryptionStatusText(int status) {
        switch (status) {
            case DevicePolicyManager.ENCRYPTION_STATUS_UNSUPPORTED:
                return "UNSUPPORTED";
            case DevicePolicyManager.ENCRYPTION_STATUS_INACTIVE:
                return "INACTIVE";
            case DevicePolicyManager.ENCRYPTION_STATUS_ACTIVATING:
                return "ACTIVATING";
            case DevicePolicyManager.ENCRYPTION_STATUS_ACTIVE:
                return "ACTIVE";
            case DevicePolicyManager.ENCRYPTION_STATUS_ACTIVE_DEFAULT_KEY:
                return "ACTIVE_DEFAULT_KEY";
            case DevicePolicyManager.ENCRYPTION_STATUS_ACTIVE_PER_USER:
                return "ACTIVE_PER_USER";
            default:
                return "UNKNOWN";
        }
    }
}
