import React, { useState, useRef } from "react";
import { Modal, ModalHeader, ModalBody } from 'reactstrap';

import { updatePhoneNumber, verifyPhoneNumber } from "../requests/Cognito";

export const ModalUserProfile = ({ toggle, show, phoneNumber, setPhoneNumber }) => {

    const [message, setMessage] = useState("");
    const [showVerification, setShowVerification] = useState(false);

    const [newPhoneNumber, setNewPhoneNumber] = useState("");
    const [verificationCode, setVerificationCode] = useState("");
    const newPhoneNumberInput = useRef(null);

    const updateNumber = async (e) => {
        e.preventDefault();

        updatePhoneNumber(newPhoneNumber, (err, res) => {
            if (err) {
                setMessage(err.message);
                setTimeout(() => {
                    setMessage("");
                }, 3000);
            }
            setShowVerification(true);
            setMessage(res.message);
        })
    };

    const verifyNumber = async (e) => {
        e.preventDefault();

        verifyPhoneNumber(verificationCode, (err, res) => {
            if (err) {
                setTimeout(() => {
                    setMessage(err.message);
                    console.error(err);
                }, 3000);
                setMessage("");
            } else {
                setShowVerification(false);
                setPhoneNumber(newPhoneNumber)
                setMessage("Phone number verified!")
                setTimeout(() => {
                    setMessage("");
                }, 3000);
            }
        })
    }

    return (
        <Modal id="buy" tabIndex="-1" role="dialog" isOpen={show} toggle={toggle}>
            <div role="document">
                <ModalHeader toggle={toggle} className="bg-dark text-primary text-center">
                    User Profile
                </ModalHeader>
                <ModalBody>
                    <div className="container">
                        <div className="row d-flex justify-content-center">
                            <div className="text-center card-box">
                                <div className="member-card">
                                    {message}
                                    {
                                        showVerification
                                        ?
                                        <form className="mt-4" onSubmit={verifyNumber}>
                                            <div className="mb-3 text-center">
                                                <label className="form-label">Verification Code</label>
                                                <input type="text" className="form-control" onChange={(e) => setVerificationCode(e.target.value)}/>
                                            </div>
                                            <div className="form-row text-center">
                                                <div className="col-12 mt-2">
                                                    <button type="submit" className="btn btn-dark btn-large text-primary">Verify Number</button>
                                                </div>
                                            </div>
                                        </form>
                                        :
                                        <form className="mt-4" onSubmit={updateNumber}>
                                            <div className="mb-3 text-center">
                                                <label className="form-label">Phone Number</label>
                                                <input type="text" className="form-control" value={phoneNumber} disabled />
                                            </div>
                                            <div className="mb-3 text-center">
                                                <label className="form-label">Change Phone Number</label>
                                                <input type="text" className="form-control" ref={newPhoneNumberInput} onChange={(e) => setNewPhoneNumber(e.target.value)} />
                                            </div>
                                            <div className="form-row text-center">
                                                <div className="col-12 mt-2">
                                                    <button type="submit" className="btn btn-dark btn-large text-primary">Update Number</button>
                                                </div>
                                            </div>
                                        </form>
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                </ModalBody>
            </div>
        </Modal>
    );
} 