package com.example.wamscw;

import android.content.Context;
import android.content.Intent;

import com.google.android.gcm.GCMBaseIntentService;

import android.app.Notification;
import android.app.NotificationManager;
import android.support.v4.app.NotificationCompat;

public class GCMIntentService extends GCMBaseIntentService {
	private static String sRegistrationId;

	public static String getRegistrationId() {
	    return sRegistrationId;
	}

	public GCMIntentService(){
	    super(ToDoActivity.SENDER_ID);
	}
	
	@Override
	protected void onError(Context arg0, String arg1) {
		// TODO Auto-generated method stub

	}

	@Override
	protected void onMessage(Context context, Intent intent) {
		NotificationCompat.Builder mBuilder =
		        new NotificationCompat.Builder(this)
		            .setSmallIcon(R.drawable.ic_launcher)
		            .setContentTitle("New todo item!")
		            .setPriority(Notification.PRIORITY_HIGH)
		            .setContentText(intent.getStringExtra("message"));
		NotificationManager mNotificationManager =
		    (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
		mNotificationManager.notify(0, mBuilder.build());
	}

	@Override
	protected void onRegistered(Context context, String registrationId) {
	    sRegistrationId = registrationId;
	}

	@Override
	protected void onUnregistered(Context arg0, String arg1) {
		// TODO Auto-generated method stub

	}
}
