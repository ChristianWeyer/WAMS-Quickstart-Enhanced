// ----------------------------------------------------------------------------
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
#import "TodoListController.h"
#import "TodoService.h"

#pragma mark * Private Interface


@interface TodoListController ()

// Private properties
@property (strong, nonatomic) TodoService *todoService;

@end


#pragma mark * Implementation


@implementation TodoListController

@synthesize todoService;
@synthesize itemText;
@synthesize activityIndicator;


#pragma mark * UIView methods

-(void)refreshView:(UIRefreshControl *)refresh {
    refresh.attributedTitle = [[NSAttributedString alloc] initWithString:@"Reload..."];

    // custom refresh logic would be placed here...
    [self refreshData];

    NSDateFormatter *formatter = [[NSDateFormatter alloc] init];
    [formatter setDateFormat:@"MMM d, h:mm a"];
    NSString *lastUpdated = [NSString stringWithFormat:@"Last updated on %@",
                    [formatter stringFromDate:[NSDate date]]];
    refresh.attributedTitle = [[NSAttributedString alloc] initWithString:lastUpdated];
    [refresh endRefreshing];
}

- (void)viewDidLoad
{
    [super viewDidLoad];

    UIRefreshControl *refresh = [[UIRefreshControl alloc] init];
    refresh.attributedTitle = [[NSAttributedString alloc] initWithString:@"Pull to refresh"];
    [refresh addTarget:self
             action:@selector(refreshView:)
             forControlEvents:UIControlEventValueChanged];
    self.refreshControl = refresh;

    self.todoService = [TodoService getCurrent];

    UIActivityIndicatorView *indicator = self.activityIndicator;
    self.todoService.busyUpdate = ^(BOOL busy) {
        if (busy) {
            [indicator startAnimating];
        } else {
            [indicator stopAnimating];
        }
    };

    NSNotificationCenter *nc = [NSNotificationCenter defaultCenter];
    [nc
	   	 addObserver:self
         selector:@selector(refreshData)
         name:@"newItemArrived"
         object:nil
    ];
}

- (void)viewDidAppear:(BOOL)animated
{
    // If user is already logged in, no need to ask for auth
    if (todoService.client.currentUser == nil)
    {
        // We want the login view to be presented after the this run loop has completed
        // Here we use a delay to ensure this.
        [self performSelector:@selector(login) withObject:self afterDelay:0.1];
    }
}

- (void) login
{
    UINavigationController *controller =

    [self.todoService.client
     loginViewControllerWithProvider:@"google"
     completion:^(MSUser *user, NSError *error) {
         if (error) {
             NSLog(@"Authentication Error: %@", error);
             // Note that error.code == -1503 indicates
             // that the user cancelled the dialog
         } else {
             [self refreshData];
         }

         [self dismissViewControllerAnimated:YES completion:nil];
     }];
    
    [self presentViewController:controller animated:YES completion:nil];
}

- (void) refreshData
{
    [self.todoService refreshDataOnSuccess:^{
        [self.tableView reloadData];
    }];
}

#pragma mark * UITableView methods


- (void) tableView:(UITableView *)tableView
                commitEditingStyle:(UITableViewCellEditingStyle)editingStyle
                 forRowAtIndexPath:(NSIndexPath *)indexPath
{
    // Find item that was committed for editing (completed)
    NSDictionary *item = [self.todoService.items objectAtIndex:indexPath.row];
    
    // Change the appearance to look greyed out until we remove the item
    UILabel *label = (UILabel *)[[tableView cellForRowAtIndexPath:indexPath] viewWithTag:1];
    label.textColor = [UIColor grayColor];
    
    // Ask the todoService to set the item's complete value to YES, and remove the row if successful
    [self.todoService completeItem:item completion:^(NSUInteger index) {
        
        // Remove the row from the UITableView
        NSIndexPath *indexPath = [NSIndexPath indexPathForRow:index inSection:0];
        [self.tableView deleteRowsAtIndexPaths:@[ indexPath ]
                              withRowAnimation:UITableViewRowAnimationTop];
    }];
}

-(UITableViewCellEditingStyle)tableView:(UITableView *)tableView editingStyleForRowAtIndexPath:(NSIndexPath *)indexPath
{
    // Find the item that is about to be edited
    NSDictionary *item = [self.todoService.items objectAtIndex:indexPath.row];
    
    // If the item is complete, then this is just pending upload. Editing is not allowed
    if ([[item objectForKey:@"complete"] boolValue]) {
        return UITableViewCellEditingStyleNone;
    }
    
    // Otherwise, allow the delete button to appear
    return UITableViewCellEditingStyleDelete;
}

-(NSString *)tableView:(UITableView *)tableView titleForDeleteConfirmationButtonForRowAtIndexPath:(NSIndexPath *)indexPath
{
    // Customize the Delete button to say "complete"
    return @"complete";
}

- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath
{
    static NSString *CellIdentifier = @"Cell";
    UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:CellIdentifier];
    if (cell == nil) {
        cell = [[UITableViewCell alloc] initWithStyle:UITableViewCellStyleDefault reuseIdentifier:CellIdentifier];
    }
    
    // Set the label on the cell and make sure the label color is black (in case this cell
    // has been reused and was previously greyed out
    UILabel *label = (UILabel *)[cell viewWithTag:1];
    label.textColor = [UIColor blackColor];
    NSDictionary *item = [self.todoService.items objectAtIndex:indexPath.row];
    label.text = [item objectForKey:@"text"];
    
    return cell;
}

- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView
{
    // Always a single section
    return 1;
}

- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section
{
    // Return the number of items in the todoService items array
    return [self.todoService.items count];
}

#pragma mark * UITextFieldDelegate methods

-(BOOL) textFieldShouldReturn:(UITextField *)textField
{
    [textField resignFirstResponder];
    return YES;
}

#pragma mark * UI Actions

- (IBAction)onAdd:(id)sender
{
    if (itemText.text.length  == 0) {
        return;
    }
    
    NSDateFormatter *formatter;
    NSString        *dateString;
    
    formatter = [[NSDateFormatter alloc] init];
    [formatter setDateFormat:@"dd-MM-yyyy HH:mm:ss"];
    
    dateString = [formatter stringFromDate:[NSDate date]];
    
    NSDictionary *item = @{ @"text" : itemText.text, @"complete" : @(NO), @"time": dateString };
    
    [self.todoService addItem:item completion:^(NSUInteger index){
        NSIndexPath *indexPath = [NSIndexPath indexPathForRow:index inSection:0];
        [self.tableView insertRowsAtIndexPaths:@[ indexPath ]
                              withRowAnimation:UITableViewRowAnimationTop];
    }];
    
    itemText.text = @"";
}

- (IBAction)tappedLogout:(id)sender {
	[self.todoService.client logout];

	for (NSHTTPCookie *value in [NSHTTPCookieStorage sharedHTTPCookieStorage].cookies) {
		[[NSHTTPCookieStorage sharedHTTPCookieStorage] deleteCookie:value];
	}

	[self login];
}

@end
