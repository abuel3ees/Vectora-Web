import { Form } from '@inertiajs/react';
import { useRef } from 'react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

export default function DeleteUser() {
    const passwordInput = useRef<HTMLInputElement>(null);

    return (
        <section className="space-y-6">
            <div className="border-b border-border/60 pb-6">
                <div className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground mb-2">§ ii</div>
                <h2 className="font-display text-2xl tracking-tight text-foreground">Close account</h2>
                <p className="mt-1 text-xs italic font-serif text-muted-foreground">Permanently remove your account and all its records.</p>
            </div>

            <div className="flex flex-col gap-4">
                <p className="text-xs italic font-serif text-muted-foreground/80 leading-relaxed max-w-md">
                    Once closed, the account cannot be recovered. All associated data will be erased without recourse.
                </p>

                <Dialog>
                    <DialogTrigger asChild>
                        <Button
                            variant="outline"
                            data-test="delete-user-button"
                            className="self-start rounded-full border-red-500/40 text-red-400 hover:bg-red-500/10 hover:border-red-400 transition-colors h-10 px-6"
                        >
                            Close account
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="border-border/60 bg-background">
                        <DialogTitle className="font-display text-xl tracking-tight">
                            Close this account?
                        </DialogTitle>
                        <DialogDescription className="text-xs italic font-serif text-muted-foreground leading-relaxed">
                            All data, records, and access will be permanently removed. Enter your password to confirm this irreversible action.
                        </DialogDescription>

                        <Form
                            {...ProfileController.destroy.form()}
                            options={{ preserveScroll: true }}
                            onError={() => passwordInput.current?.focus()}
                            resetOnSuccess
                            className="flex flex-col gap-6"
                        >
                            {({ resetAndClearErrors, processing, errors }) => (
                                <>
                                    <div className="flex flex-col gap-3">
                                        <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Password</label>
                                        <PasswordInput
                                            id="password"
                                            name="password"
                                            ref={passwordInput}
                                            placeholder="Confirm with your password"
                                            autoComplete="current-password"
                                            className="h-11 border-0 border-b border-border/60 rounded-none bg-transparent px-0 text-base focus-visible:ring-0 focus-visible:border-primary shadow-none"
                                        />
                                        <InputError message={errors.password} />
                                    </div>

                                    <DialogFooter className="gap-2">
                                        <DialogClose asChild>
                                            <Button
                                                variant="ghost"
                                                onClick={() => resetAndClearErrors()}
                                                className="rounded-full"
                                            >
                                                Cancel
                                            </Button>
                                        </DialogClose>

                                        <Button
                                            variant="outline"
                                            disabled={processing}
                                            asChild
                                            className="rounded-full border-red-500/40 text-red-400 hover:bg-red-500/10 hover:border-red-400 transition-colors"
                                        >
                                            <button type="submit" data-test="confirm-delete-user-button">
                                                {processing ? 'Closing…' : 'Close account'}
                                            </button>
                                        </Button>
                                    </DialogFooter>
                                </>
                            )}
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>
        </section>
    );
}
