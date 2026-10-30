plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("com.chaquo.python")
}

// The app's own version. The patcher scripts it carries have their own versions in their file names.
val appVersion = "0.1"

android {
    namespace = "com.techynest.nestpatcher"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.techynest.nestpatcher"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = appVersion
        ndk {
            // Chaquopy's Python 3.12 is 64-bit only, so very old 32-bit phones are not supported.
            abiFilters += listOf("arm64-v8a", "x86_64")
        }
    }

    // Release signing comes from GitHub secrets when they are set (see docs/Guide_Android_App_v0.1.md);
    // otherwise the build is signed with a throwaway debug key.
    val keystoreFile = System.getenv("NEST_KEYSTORE_FILE")
    signingConfigs {
        if (!keystoreFile.isNullOrBlank()) {
            create("release") {
                storeFile = file(keystoreFile)
                storePassword = System.getenv("NEST_KEYSTORE_PASSWORD")
                keyAlias = System.getenv("NEST_KEY_ALIAS")
                keyPassword = System.getenv("NEST_KEY_PASSWORD")
            }
        }
    }
    buildTypes {
        release {
            isMinifyEnabled = false
            signingConfig = if (!keystoreFile.isNullOrBlank()) signingConfigs.getByName("release")
                            else signingConfigs.getByName("debug")
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    sourceSets {
        getByName("main") {
            assets.srcDir(layout.buildDirectory.dir("generated/patchers"))
        }
    }
}

chaquopy {
    defaultConfig {
        version = "3.12"
    }
}

// Ship every patcher in ../../patchers inside the app, so the phone can run any of them.
val copyPatchers by tasks.registering(Copy::class) {
    from(rootProject.file("../patchers")) { include("*.py") }
    into(layout.buildDirectory.dir("generated/patchers/patchers"))
}
tasks.named("preBuild") { dependsOn(copyPatchers) }

dependencies {
    implementation("androidx.appcompat:appcompat:1.6.1")
}
