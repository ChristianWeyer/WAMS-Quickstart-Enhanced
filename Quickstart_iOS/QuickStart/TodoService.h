﻿// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// ----------------------------------------------------------------------------
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//

#import <WindowsAzureMobileServices/WindowsAzureMobileServices.h>
#import <Foundation/Foundation.h>


#pragma mark * Block Definitions


typedef void (^CompletionBlock) ();
typedef void (^CompletionWithIndexBlock) (NSUInteger index);
typedef void (^BusyUpdateBlock) (BOOL busy);


#pragma mark * TodoService public interface


@interface TodoService : NSObject<MSFilter>

@property (nonatomic, strong)   NSArray *items;
@property (nonatomic, strong)   MSClient *client;
@property (nonatomic, copy)     BusyUpdateBlock busyUpdate;

// Declare the singleton instance for other users
+ (TodoService *) getCurrent;

- (void) refreshDataOnSuccess:(CompletionBlock) completion;

- (void) addItem:(NSDictionary *) item
      completion:(CompletionWithIndexBlock) completion;

- (void) completeItem: (NSDictionary *) item
           completion:(CompletionWithIndexBlock) completion;

- (void) handleRequest:(NSURLRequest *)request
                onNext:(MSFilterNextBlock)onNext
            onResponse:(MSFilterResponseBlock)onResponse;

// Declare method to register device token for other users
- (void) registerDeviceToken:(NSString *)deviceToken;

@end
